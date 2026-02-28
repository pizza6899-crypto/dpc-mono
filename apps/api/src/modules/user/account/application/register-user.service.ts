import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { CountryUtil } from 'src/utils/country.util';
import { UserRoleType, RegistrationMethod, LoginIdType } from '@prisma/client';
import { CreateUserService } from 'src/modules/user/profile/application/create-user.service';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import { CheckAvailabilityService } from './check-availability.service';
import { AvailabilityField } from '../controllers/user/dto/request/availability.request.dto';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from '@repo/shared';
import { FindCodeByCodeService } from 'src/modules/affiliate/code/application/find-code-by-code.service';
import { ThrottleService } from 'src/common/throttle/throttle.service';
import { IdUtil } from 'src/utils/id.util';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import {
    ReferralCodeNotFoundException,
    ReferralCodeInactiveException,
    ReferralCodeExpiredException,
} from 'src/modules/affiliate/referral/domain/referral.exception';

export interface RegisterUserParams {
    registrationMethod: Exclude<RegistrationMethod, 'SOCIAL'>;
    loginId: string;
    password: string;
    nickname?: string;
    referralCode?: string;
    requestInfo: RequestClientInfo;
}

export interface RegisterUserResult {
    id: bigint;
    loginId: string | null;
    nickname: string;
    email: string | null;
    referralCode?: string;
}

import { ModerationService } from 'src/modules/moderation/application/moderation.service';

@Injectable()
export class RegisterUserService {
    private readonly logger = new Logger(RegisterUserService.name);

    constructor(
        private readonly findCodeByCodeService: FindCodeByCodeService,
        private readonly linkReferralService: LinkReferralService,
        private readonly createUserService: CreateUserService,
        private readonly getUserConfigService: GetUserConfigService,
        private readonly throttleService: ThrottleService,
        private readonly checkAvailabilityService: CheckAvailabilityService,
        private readonly moderationService: ModerationService,
    ) { }

    @Transactional()
    async execute(params: RegisterUserParams): Promise<RegisterUserResult> {
        const {
            registrationMethod,
            loginId: providedLoginId,
            password,
            nickname: providedNickname,
            referralCode,
            requestInfo,
        } = params;

        // 1. 전역 정책 조회
        const config = await this.getUserConfigService.execute();

        // 2. 가입 정책 검증 (비용이 적은 체크 우선)
        // 2-1. IP별 일일 가입 제한 체크 (쓰로틀링)
        const throttleKey = `registration:daily:${requestInfo.ip}`;
        if (config.maxDailySignupPerIp > 0) {
            const throttleResult = await this.throttleService.checkLimit(throttleKey, {
                limit: config.maxDailySignupPerIp,
                ttl: 86400,
            });
            if (!throttleResult.allowed) {
                throw new ApiException(MessageCode.SIGNUP_DAILY_LIMIT_EXCEEDED, HttpStatus.TOO_MANY_REQUESTS, 'Daily signup limit exceeded for this IP.');
            }
        }

        // 2-2. 서비스 가입 허용 여부
        if (!config.allowSignup) {
            throw new ApiException(MessageCode.SIGNUP_DISABLED, HttpStatus.FORBIDDEN);
        }

        // 3. 레퍼럴 코드 사전 검증 (DB 조회)
        if (referralCode) {
            const code = await this.findCodeByCodeService.execute({ code: referralCode });
            if (!code) throw new ReferralCodeNotFoundException(referralCode);
            if (!code.isActive) throw new ReferralCodeInactiveException(code.code);
            if (code.isExpired()) throw new ReferralCodeExpiredException(code.code);
        } else if (config.requireReferralCode) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Referral code is required.');
        }

        // 4. 필드 유효성 및 가용성 검증 (Regex + DB 중복 + AI 모더레이션 - 비용이 큼)
        // 4-1. 로그인 ID 검증
        await this.validateField(AvailabilityField.LOGIN_ID, providedLoginId);

        // 4-2. 닉네임 정책 및 검증
        if (providedNickname) {
            await this.validateField(AvailabilityField.NICKNAME, providedNickname);
        } else if (config.requireNickname) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Nickname is required.');
        }

        // 5. 국가 및 지역화 설정 결정
        const countryConfig = CountryUtil.getCountryConfig({
            countryCode: requestInfo.country,
            timezone: requestInfo.timezone,
        });

        // 6. 비밀번호 해싱 및 닉네임 결정
        const passwordHash = await hashPassword(password);
        const nickname = providedNickname || `user_${IdUtil.generateUrlSafeNanoid(6)}`;

        // 7. 사용자 생성
        const { user } = await this.createUserService.execute({
            loginId: providedLoginId,
            nickname,
            email: config.loginIdType === LoginIdType.EMAIL ? providedLoginId : null,
            phoneNumber: config.loginIdType === LoginIdType.PHONE_NUMBER ? providedLoginId : null,
            passwordHash,
            registrationMethod,
            role: UserRoleType.USER,
            country: requestInfo.country,
            timezone: countryConfig.timezone,
            primaryCurrency: config.defaultPrimaryCurrency,
            playCurrency: config.defaultPlayCurrency,
        });

        // 8. 레퍼럴 매핑 (코드가 있는 경우에만)
        if (referralCode) {
            await this.linkReferralService.execute({
                subUserId: user.id,
                referralCode,
                ipAddress: requestInfo.ip,
                deviceFingerprint: requestInfo.fingerprint,
                userAgent: requestInfo.userAgent,
                requestInfo,
            });
        }

        // 9. 성공 시 쓰로틀링 카운트 증가
        if (config.maxDailySignupPerIp > 0) {
            await this.throttleService.checkAndIncrement(throttleKey, {
                limit: config.maxDailySignupPerIp,
                ttl: 86400,
            });
        }

        return {
            id: user.id,
            loginId: user.loginId,
            nickname: user.nickname,
            email: user.email,
            referralCode,
        };
    }

    /**
     * 필드 유효성 및 가용성 통합 검증 (Regex + Moderation + Duplication)
     */
    private async validateField(field: AvailabilityField, value: string) {
        // 1. 기본 형식 및 중복 검사 (DB 기반 금지어 단순 체크 포함)
        const result = await this.checkAvailabilityService.execute({
            field,
            value,
        });

        if (!result.available) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, result.message);
        }

        // 2. 상세 모더레이션 (AI 검증)
        // [Policy] 로그인 ID는 비공개이며 형식이 엄격하므로 AI 검토를 제외하여 비용/오탐을 줄입니다.
        // 닉네임만 AI 검토를 수행합니다.
        if (field === AvailabilityField.NICKNAME) {
            await this.moderationService.verify(value);
        }
    }
}

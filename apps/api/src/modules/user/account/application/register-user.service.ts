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

/**
 * 비밀번호 기반 사용자 계정 생성 및 온보딩 서비스 (FIAT, CRYPTO 통합)
 */
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

        // 2. 가입 정책 검증
        if (!config.allowSignup) {
            throw new ApiException(MessageCode.SIGNUP_DISABLED, HttpStatus.FORBIDDEN);
        }

        // 2-1. 닉네임 정책 검증
        if (providedNickname) {
            await this.validateField(AvailabilityField.NICKNAME, providedNickname);
        } else if (config.requireNickname) {
            // 정책적으로 닉네임이 필수인데 입력하지 않은 경우
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Nickname is required.');
        }

        // 3. 레퍼럴 코드 사전 검증
        if (referralCode) {
            const code = await this.findCodeByCodeService.execute({ code: referralCode });
            if (!code) throw new ReferralCodeNotFoundException(referralCode);
            if (!code.isActive) throw new ReferralCodeInactiveException(code.code);
            if (code.isExpired()) throw new ReferralCodeExpiredException(code.code);
        } else if (config.requireReferralCode) {
            // 정책적으로 레퍼럴 코드가 필수인데 입력하지 않은 경우
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Referral code is required.');
        }

        // 4. 로그인 ID 결정 및 타입별 통합 검증
        const finalLoginId = providedLoginId;
        // 모든 로그인 타입은 중복 검사 시 LOGIN_ID 필드로 통합하여 처리합니다.
        // (내부적으로 LoginIdType에 따른 정규식 검증은 CheckAvailabilityService에서 수행됨)
        await this.validateField(AvailabilityField.LOGIN_ID, finalLoginId);

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
            loginId: finalLoginId,
            nickname,
            email: config.loginIdType === LoginIdType.EMAIL ? finalLoginId : null,
            phoneNumber: config.loginIdType === LoginIdType.PHONE_NUMBER ? finalLoginId : null,
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
            const key = `registration:daily:${requestInfo.ip}`;
            await this.throttleService.checkAndIncrement(key, {
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
        const result = await this.checkAvailabilityService.execute({
            field,
            value,
            options: { includeAi: true }, // 가입 시에는 엄격하게 AI 검토 포함
        });

        if (!result.available) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, result.message);
        }
    }
}

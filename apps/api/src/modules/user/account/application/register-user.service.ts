import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { CountryUtil } from 'src/utils/country.util';
import { UserRoleType, RegistrationMethod, LoginIdType } from '@prisma/client';
import { CreateUserService } from 'src/modules/user/profile/application/create-user.service';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import { UserOnboardingService } from './user-onboarding.service';
import { CheckAvailabilityService } from './check-availability.service';
import { AvailabilityField } from '../controllers/user/dto/request/check-availability.request.dto';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from '@repo/shared';
import { FindCodeByCodeService } from 'src/modules/affiliate/code/application/find-code-by-code.service';
import { ThrottleService } from 'src/common/throttle/throttle.service';
import {
    ReferralCodeNotFoundException,
    ReferralCodeInactiveException,
    ReferralCodeExpiredException,
} from 'src/modules/affiliate/referral/domain/referral.exception';

export interface RegisterUserParams {
    registrationMethod: Exclude<RegistrationMethod, 'SOCIAL'>;
    loginId?: string;
    email?: string;
    password: string;
    phoneNumber?: string;
    nickname?: string;
    birthDate?: string;
    telegramUsername?: string;
    referralCode?: string;
    requestInfo: RequestClientInfo;
}

export interface RegisterUserResult {
    id: bigint;
    email: string | null;
}

/**
 * 비밀번호 기반 사용자 계정 생성 및 온보딩 서비스 (FIAT, CRYPTO)
 */
@Injectable()
export class RegisterUserService {
    private readonly logger = new Logger(RegisterUserService.name);

    constructor(
        private readonly findCodeByCodeService: FindCodeByCodeService,
        private readonly createUserService: CreateUserService,
        private readonly onboardingService: UserOnboardingService,
        private readonly getUserConfigService: GetUserConfigService,
        private readonly throttleService: ThrottleService,
        private readonly checkAvailabilityService: CheckAvailabilityService,
    ) { }

    @Transactional()
    async execute(params: RegisterUserParams): Promise<RegisterUserResult> {
        const {
            registrationMethod,
            loginId: providedLoginId,
            email: providedEmail,
            password,
            phoneNumber: providedPhoneNumber,
            nickname: providedNickname,
            birthDate: providedBirthDate,
            telegramUsername,
            referralCode,
            requestInfo,
        } = params;

        // 1. 전역 정책 조회
        const config = await this.getUserConfigService.execute();

        // 2. 가입 정책 검증
        if (!config.allowSignup) {
            throw new ApiException(MessageCode.SIGNUP_DISABLED, HttpStatus.FORBIDDEN);
        }

        // 2-1. 닉네임 검증
        if (providedNickname) {
            await this.validateField(AvailabilityField.NICKNAME, providedNickname);
        }

        // 3. 레퍼럴 코드 사전 검증
        if (referralCode) {
            const code = await this.findCodeByCodeService.execute({ code: referralCode });
            if (!code) throw new ReferralCodeNotFoundException(referralCode);
            if (!code.isActive) throw new ReferralCodeInactiveException(code.code);
            if (code.isExpired()) throw new ReferralCodeExpiredException(code.code);
        }

        // 4. 로그인 ID 결정 및 타입별 통합 검증
        let finalLoginId: string;

        switch (config.loginIdType) {
            case LoginIdType.EMAIL:
                if (!providedEmail) throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Email is required.');
                finalLoginId = providedEmail;
                await this.validateField(AvailabilityField.EMAIL, finalLoginId);
                break;
            case LoginIdType.PHONE_NUMBER:
                if (!providedPhoneNumber) throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Phone number is required.');
                finalLoginId = providedPhoneNumber;
                await this.validateField(AvailabilityField.PHONE_NUMBER, finalLoginId);
                break;
            case LoginIdType.USERNAME:
                if (!providedLoginId) throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Login ID is required.');
                finalLoginId = providedLoginId;
                await this.validateField(AvailabilityField.LOGIN_ID, finalLoginId);
                break;
            default:
                finalLoginId = providedEmail || providedLoginId || '';
        }

        // 5. 국가 및 지역화 설정 결정
        const countryConfig = CountryUtil.getCountryConfig({
            countryCode: requestInfo.country,
            timezone: requestInfo.timezone,
        });

        // 6. 비밀번호 해싱 및 닉네임 결정
        const passwordHash = await hashPassword(password);
        const nickname = providedNickname || (providedEmail ? providedEmail.split('@')[0] : `user_${finalLoginId.slice(-5)}`);

        // 7. 사용자 생성
        const { user } = await this.createUserService.execute({
            loginId: finalLoginId,
            nickname,
            email: providedEmail,
            phoneNumber: providedPhoneNumber,
            telegramUsername,
            birthDate: providedBirthDate ? new Date(providedBirthDate) : null,
            passwordHash,
            registrationMethod,
            role: UserRoleType.USER,
            country: requestInfo.country,
            timezone: countryConfig.timezone,
            primaryCurrency: config.defaultPrimaryCurrency,
            playCurrency: config.defaultPlayCurrency,
        });

        // 8. 온보딩 프로세스 실행 (공통 서비스 위임)
        await this.onboardingService.execute({
            user,
            registrationMethod,
            loginIdType: config.loginIdType,
            referralCode,
            requestInfo,
        });

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
            email: user.email,
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

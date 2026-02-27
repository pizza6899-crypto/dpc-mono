import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CountryUtil } from 'src/utils/country.util';
import { CreateCodeService } from 'src/modules/affiliate/code/application/create-code.service';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { FindCodeByCodeService } from 'src/modules/affiliate/code/application/find-code-by-code.service';
import { ThrottleService } from 'src/common/throttle/throttle.service';
import {
    ReferralCodeNotFoundException,
    ReferralCodeInactiveException,
    ReferralCodeExpiredException,
} from 'src/modules/affiliate/referral/domain/referral.exception';
import { InitializeUserWalletsService } from 'src/modules/wallet/application/initialize-user-wallets.service';
import { InitializeUserTierService } from 'src/modules/tier/profile/application/initialize-user-tier.service';
import { UserRoleType, RegistrationMethod, LoginIdType } from '@prisma/client';
import { CreateUserService } from 'src/modules/user/profile/application/create-user.service';
import { GetUserConfigService } from 'src/modules/user/config/application/get-user-config.service';
import { ApiException } from 'src/common/http/exception/api.exception';
import { MessageCode } from '@repo/shared';

export interface RegisterUserParams {
    loginId?: string;
    email?: string;
    password: string;
    phoneNumber?: string;
    nickname?: string;
    birthDate?: string;
    referralCode?: string;
    requestInfo: RequestClientInfo;
}

export interface RegisterUserResult {
    id: bigint;
    email: string | null;
}

/**
 * 일반 사용자 계정 생성 및 온보딩 서비스
 */
@Injectable()
export class RegisterUserService {
    private readonly logger = new Logger(RegisterUserService.name);

    constructor(
        private readonly dispatchLogService: DispatchLogService,
        private readonly linkReferralService: LinkReferralService,
        private readonly findCodeByCodeService: FindCodeByCodeService,
        private readonly createCodeService: CreateCodeService,
        private readonly createUserService: CreateUserService,
        private readonly initializeUserWalletsService: InitializeUserWalletsService,
        private readonly initializeUserTierService: InitializeUserTierService,
        private readonly getUserConfigService: GetUserConfigService,
        private readonly throttleService: ThrottleService,
    ) { }

    @Transactional()
    async execute(params: RegisterUserParams): Promise<RegisterUserResult> {
        const {
            loginId: providedLoginId,
            email: providedEmail,
            password,
            phoneNumber: providedPhoneNumber,
            nickname: providedNickname,
            birthDate: providedBirthDate,
            referralCode,
            requestInfo,
        } = params;

        // 1. 전역 정책 조회
        const config = await this.getUserConfigService.execute();

        // 2. 가입 정책 검증
        if (!config.allowSignup) {
            throw new ApiException(MessageCode.SIGNUP_DISABLED, HttpStatus.FORBIDDEN);
        }

        // [Validation] 필수 필드 체크
        if (config.requireEmail && !providedEmail) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Email is required.');
        }
        if (config.requirePhoneNumber && !providedPhoneNumber) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Phone number is required.');
        }
        if (config.requireBirthDate && !providedBirthDate) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Birth date is required.');
        }
        if (config.requireNickname && !providedNickname) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Nickname is required.');
        }
        if (config.requireReferralCode && !referralCode) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Referral code is required.');
        }

        // [Validation] 일반 공통 정규식 체크 (설정에 있는 경우)
        if (config.passwordRegex && !new RegExp(config.passwordRegex).test(password)) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Password does not meet the requirements.');
        }
        if (providedNickname && config.nicknameRegex && !new RegExp(config.nicknameRegex).test(providedNickname)) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Nickname format is invalid.');
        }

        // 3. 레퍼럴 코드 사전 검증
        if (referralCode) {
            const code = await this.findCodeByCodeService.execute({ code: referralCode });
            if (!code) throw new ReferralCodeNotFoundException(referralCode);
            if (!code.isActive) throw new ReferralCodeInactiveException(code.code);
            if (code.isExpired()) throw new ReferralCodeExpiredException(code.code);
        }

        // 4. 로그인 ID 결정 및 타입별 정규식 검증
        let finalLoginId: string;
        let loginIdRegex: string | null = null;

        switch (config.loginIdType) {
            case LoginIdType.EMAIL:
                if (!providedEmail) throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Email is required.');
                finalLoginId = providedEmail;
                loginIdRegex = config.loginIdEmailRegex;
                break;
            case LoginIdType.PHONE_NUMBER:
                if (!providedPhoneNumber) throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Phone number is required.');
                finalLoginId = providedPhoneNumber;
                loginIdRegex = config.loginIdPhoneNumberRegex;
                break;
            case LoginIdType.USERNAME:
                if (!providedLoginId) throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Login ID is required.');
                finalLoginId = providedLoginId;
                loginIdRegex = config.loginIdUsernameRegex;
                break;
            default:
                finalLoginId = providedEmail || providedLoginId || '';
        }

        if (loginIdRegex && !new RegExp(loginIdRegex).test(finalLoginId)) {
            throw new ApiException(MessageCode.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, 'Login ID format is invalid.');
        }

        // 5. 국가 및 지역화 설정 결정
        const countryConfig = CountryUtil.getCountryConfig({
            countryCode: requestInfo.country,
            timezone: requestInfo.timezone,
        });

        // 6. 비밀번호 해싱 및 닉네임 결정
        const passwordHash = await hashPassword(password);
        const nickname = providedNickname || (providedEmail ? providedEmail.split('@')[0] : finalLoginId);

        // 7. 사용자 생성 (Profile 모듈의 CreateUserService 호출)
        const { user } = await this.createUserService.execute({
            loginId: finalLoginId,
            nickname,
            email: providedEmail,
            phoneNumber: providedPhoneNumber,
            birthDate: providedBirthDate ? new Date(providedBirthDate) : null,
            passwordHash,
            registrationMethod: RegistrationMethod.FULL,
            role: UserRoleType.USER,
            country: requestInfo.country,
            timezone: countryConfig.timezone,
            primaryCurrency: config.defaultPrimaryCurrency,
            playCurrency: config.defaultPlayCurrency,
        });

        // 5. 온보딩 프로세스 실행 (월렛, 티어, 자체 레퍼럴 코드)
        await this.initializeUserWalletsService.execute(user.id);
        await this.initializeUserTierService.execute(user.id);
        await this.createCodeService.execute({
            userId: user.id,
            campaignName: 'Default',
        });

        // 6. 레퍼럴 연결 (제공된 경우)
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

        // 7. Audit 로그 기록
        await this.logActivity(user.id, config.loginIdType, referralCode, requestInfo);

        // 8. 성공 시 쓰로틀링 카운트 증가
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

    private async logActivity(userId: bigint, loginIdType: LoginIdType, referralCode: string | undefined, requestInfo: RequestClientInfo) {
        try {
            await this.dispatchLogService.dispatch(
                {
                    type: LogType.AUTH,
                    data: {
                        userId: userId.toString(),
                        action: 'USER_REGISTER',
                        status: 'SUCCESS',
                        metadata: {
                            registrationMethod: RegistrationMethod.FULL,
                            loginIdType: loginIdType,
                            referralCode: referralCode || null,
                            country: requestInfo.country,
                        },
                    },
                },
                requestInfo,
            );
        } catch (error) {
            this.logger.error(`Audit log failed: ${error.message}`);
        }
    }
}

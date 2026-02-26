import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { hashPassword } from 'src/utils/password.util';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { CountryUtil } from 'src/utils/country.util';
import { CreateCodeService } from 'src/modules/affiliate/code/application/create-code.service';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { FindCodeByCodeService } from 'src/modules/affiliate/code/application/find-code-by-code.service';
import {
    ReferralCodeNotFoundException,
    ReferralCodeInactiveException,
    ReferralCodeExpiredException,
} from 'src/modules/affiliate/referral/domain/referral.exception';
import { InitializeUserWalletsService } from 'src/modules/wallet/application/initialize-user-wallets.service';
import { InitializeUserTierService } from 'src/modules/tier/profile/application/initialize-user-tier.service';
import { UserRoleType, RegistrationMethod } from '@prisma/client';
import { CreateUserService } from 'src/modules/user/profile/application/create-user.service';

export interface RegisterUserParams {
    email: string;
    password: string;
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
    ) { }

    @Transactional()
    async execute(params: RegisterUserParams): Promise<RegisterUserResult> {
        const { email, password, referralCode, requestInfo } = params;

        // 1. 레퍼럴 코드 사전 검증
        if (referralCode) {
            const code = await this.findCodeByCodeService.execute({ code: referralCode });
            if (!code) throw new ReferralCodeNotFoundException(referralCode);
            if (!code.isActive) throw new ReferralCodeInactiveException(code.code);
            if (code.isExpired()) throw new ReferralCodeExpiredException(code.code);
        }

        // 2. 국가 설정 기반 정보 구성
        const countryConfig = CountryUtil.getCountryConfig({
            countryCode: requestInfo.country,
            timezone: requestInfo.timezone,
        });

        // 3. 비밀번호 해싱 및 기본 계정 정보 파생
        const passwordHash = await hashPassword(password);
        const emailPrefix = email.split('@')[0];
        const loginId = email; // 이메일을 로그인 ID로 사용 (기본값)
        const nickname = emailPrefix; // 이메일 앞부분을 닉네임으로 사용 (기본값)

        // 4. 사용자 생성 (Profile 모듈의 CreateUserService 호출)
        const { user } = await this.createUserService.execute({
            loginId,
            nickname,
            email,
            passwordHash,
            registrationMethod: RegistrationMethod.FULL,
            role: UserRoleType.USER,
            country: requestInfo.country,
            timezone: countryConfig.timezone,
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
        await this.logActivity(user.id, referralCode, requestInfo);

        return {
            id: user.id,
            email: user.email,
        };
    }

    private async logActivity(userId: bigint, referralCode: string | undefined, requestInfo: RequestClientInfo) {
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
                            referralCode: referralCode || null,
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

import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { InitializeUserWalletsService } from 'src/modules/wallet/application/initialize-user-wallets.service';
import { InitializeUserTierService } from 'src/modules/tier/profile/application/initialize-user-tier.service';
import { CreateCodeService } from 'src/modules/affiliate/code/application/create-code.service';
import { LinkReferralService } from 'src/modules/affiliate/referral/application/link-referral.service';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import { RegistrationMethod, LoginIdType } from '@prisma/client';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { User } from 'src/modules/user/profile/domain';

export interface OnboardingParams {
    user: User;
    registrationMethod: RegistrationMethod;
    loginIdType: LoginIdType;
    referralCode?: string;
    requestInfo: RequestClientInfo;
}

@Injectable()
export class UserOnboardingService {
    private readonly logger = new Logger(UserOnboardingService.name);

    constructor(
        private readonly initializeUserWalletsService: InitializeUserWalletsService,
        private readonly initializeUserTierService: InitializeUserTierService,
        private readonly createCodeService: CreateCodeService,
        private readonly linkReferralService: LinkReferralService,
        private readonly dispatchLogService: DispatchLogService,
    ) { }

    @Transactional()
    async execute(params: OnboardingParams): Promise<void> {
        const { user, registrationMethod, loginIdType, referralCode, requestInfo } = params;

        // 1. 초기화 프로세스 (월렛, 티어, 자체 레퍼럴 코드)
        await this.initializeUserWalletsService.execute(user.id);
        await this.initializeUserTierService.execute(user.id);
        await this.createCodeService.execute({
            userId: user.id,
            campaignName: 'Default',
        });

        // 2. 추천인 연결 (제공된 경우)
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

        // 3. Audit 로그 기록
        await this.logActivity(user.id, registrationMethod, loginIdType, referralCode, requestInfo);
    }

    private async logActivity(userId: bigint, registrationMethod: RegistrationMethod, loginIdType: LoginIdType, referralCode: string | undefined, requestInfo: RequestClientInfo) {
        try {
            await this.dispatchLogService.dispatch(
                {
                    type: LogType.AUTH,
                    data: {
                        userId: userId.toString(),
                        action: 'USER_REGISTER',
                        status: 'SUCCESS',
                        metadata: {
                            registrationMethod,
                            loginIdType,
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

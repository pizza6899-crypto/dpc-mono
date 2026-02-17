// src/modules/promotion/application/apply-coupon-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { PromotionPolicy, PromotionNotFoundException, PromotionInvalidConfigurationException, PromotionUsageLimitExceededException } from '../domain';
import type { UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import type { RequestClientInfo } from 'src/common/http/types';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { UpdateOperation, WalletActionName } from '../../wallet/domain';
import { UserWalletBalanceType, UserWalletTransactionType } from '@prisma/client';
import { SendAlertService } from '../../notification/alert/application/send-alert.service';
import { NOTIFICATION_EVENTS } from '../../notification/common';
import { ChannelType } from '@prisma/client';
import { PromotionMetadata } from '../../wallet/domain/model/user-wallet-transaction-metadata';

import { AuthenticatedUser } from 'src/common/auth/types/auth.types';
import { CreateWageringRequirementService } from 'src/modules/wagering/requirement/application';

interface ApplyCouponPromotionParams {
    user: AuthenticatedUser;
    code: string;
    currency: ExchangeCurrencyCode;
    now?: Date;
    requestInfo?: RequestClientInfo;
}

@Injectable()
export class ApplyCouponPromotionService {
    private readonly logger = new Logger(ApplyCouponPromotionService.name);

    constructor(
        @Inject(PROMOTION_REPOSITORY)
        private readonly repository: PromotionRepositoryPort,
        private readonly policy: PromotionPolicy,
        private readonly createWageringRequirementService: CreateWageringRequirementService,
        private readonly updateUserBalanceService: UpdateUserBalanceService,
        private readonly sendAlertService: SendAlertService,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute({
        user,
        code,
        currency,
        now = new Date(),
        requestInfo,
    }: ApplyCouponPromotionParams): Promise<UserPromotion> {
        const userId = user.id;

        // 0. 락 획득 (동시성 제어)
        await this.advisoryLockService.acquireLock(LockNamespace.PROMOTION, userId.toString(), {
            throwThrottleError: true,
        });

        // 1. 프로모션 조회 (코드로 조회)
        const promotion = await this.repository.findByCode(code);
        if (!promotion) {
            throw new PromotionNotFoundException();
        }

        // 2. 비입금 프로모션인지 확인
        if (promotion.isDepositRequired) {
            throw new PromotionInvalidConfigurationException('This promotion requires a deposit');
        }

        // 3. 통화별 설정 조회
        const currencySettings = await this.repository.getCurrencySettings(
            promotion.id,
            currency,
        );

        // 4. 사용자 정보 확인
        const hasPreviousDeposits = await this.repository.hasPreviousDeposits(userId);
        const hasWithdrawn = await this.repository.hasWithdrawn(userId);

        // 5. 기존 UserPromotion 조회 (중복 참여 체크용)
        const existingUserPromotion = await this.repository.findUserPromotion(userId, promotion.id);

        // 6. 자격 검증 (비입금형이므로 depositAmount는 0으로 전달)
        this.policy.validateEligibility(
            promotion,
            new Prisma.Decimal(0),
            currencySettings,
            existingUserPromotion,
            hasPreviousDeposits,
            hasWithdrawn,
            now,
        );

        // 7. 보너스 계산 (FIXED_AMOUNT이므로 maxBonusAmount가 지급액임)
        const bonusAmount = currencySettings.maxBonusAmount ?? new Prisma.Decimal(0);
        if (bonusAmount.lte(0)) {
            throw new PromotionInvalidConfigurationException('Coupon bonus amount must be positive');
        }

        // 8. 롤링 배수 계산
        const rollingMultiplier = promotion.getRollingMultiplier();
        const targetRollingAmount = bonusAmount.mul(rollingMultiplier);

        // 9. 사용 횟수 증가 (Atomic)
        const updatedPromotion = await this.repository.incrementUsageCount(promotion.id);
        if (
            updatedPromotion.maxUsageCount !== null &&
            updatedPromotion.currentUsageCount > updatedPromotion.maxUsageCount
        ) {
            throw new PromotionUsageLimitExceededException();
        }

        // 10. 만료 시간 계산
        let expiresAt: Date | null = null;
        if (promotion.bonusExpiryMinutes) {
            expiresAt = new Date(now.getTime() + promotion.bonusExpiryMinutes * 60 * 1000);
        }

        // 11. 지갑 잔액 업데이트 (보너스 지급)
        await this.updateUserBalanceService.updateBalance({
            userId,
            currency,
            amount: bonusAmount,
            operation: UpdateOperation.ADD,
            balanceType: UserWalletBalanceType.BONUS,
            transactionType: UserWalletTransactionType.BONUS_IN,
            referenceId: promotion.id,
        }, {
            internalNote: `Coupon promotion applied: ${code}`,
            actionName: WalletActionName.APPLY_COUPON_PROMOTION,
            metadata: {
                promotionId: promotion.id.toString(),
                code,
                promotionType: 'COUPON',
            } as PromotionMetadata,
        });

        // 13. UserPromotion 생성
        const userPromotion = await this.repository.createUserPromotion({
            userId,
            promotionId: promotion.id,
            depositAmount: new Prisma.Decimal(0),
            lockedAmount: new Prisma.Decimal(0),
            bonusAmount,
            targetRollingAmount,
            currency,
            expiresAt,
        });

        // 14. 롤링 생성
        if (targetRollingAmount.gt(0)) {
            await this.createWageringRequirementService.execute({
                userId,
                currency,
                sourceType: 'PROMOTION_BONUS',
                principalAmount: bonusAmount,
                multiplier: new Prisma.Decimal(rollingMultiplier),
                initialLockedCash: new Prisma.Decimal(0),
                grantedBonusAmount: bonusAmount,
                sourceId: BigInt(userPromotion.id),
                requestInfo,
            });
        }

        // 15. 인박스 알림 발송
        try {
            await this.sendAlertService.execute({
                event: NOTIFICATION_EVENTS.PROMOTION_APPLIED,
                userId,
                channels: [ChannelType.IN_APP],
                payload: {
                    promotionName:
                        promotion.getTranslation(user.language)?.name ||
                        promotion.getTranslations()?.[0]?.name ||
                        promotion.code,
                    bonusAmount: bonusAmount.toString(),
                    currency: currency,
                },
            });
        } catch (error) {
            // 알림 발송 실패가 비즈니스 로직(쿠폰 지급)을 실패하게 하면 안 됨
            this.logger.error(`Failed to send promotion inbox notification: ${error}`);
        }

        this.logger.log(
            `Coupon applied: userId=${userId}, code=${code}, bonusAmount=${bonusAmount.toString()}`,
        );

        return userPromotion;
    }
}

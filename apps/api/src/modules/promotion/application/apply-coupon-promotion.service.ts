// src/modules/promotion/application/apply-coupon-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode, TransactionType, TransactionStatus } from 'src/generated/prisma';
import { PromotionPolicy, PromotionNotFoundException, PromotionInvalidConfigurationException } from '../domain';
import type { UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { CreateWageringRequirementService } from '../../wagering/application/create-wagering-requirement.service';
import type { RequestClientInfo } from 'src/common/http/types';
import { UpdateUserBalanceService } from '../../wallet/application/update-user-balance.service';
import { CreateWalletTransactionService } from '../../wallet/application/create-wallet-transaction.service';
import { BalanceType, UpdateOperation } from '../../wallet/domain';
import { SendAlertService } from '../../notification/alert/application/send-alert.service';
import { NOTIFICATION_EVENTS } from '../../notification/common';
import { ChannelType } from 'src/generated/prisma';

import { AuthenticatedUser } from 'src/common/auth/types/auth.types';

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
        private readonly createWalletTransactionService: CreateWalletTransactionService,
        private readonly sendAlertService: SendAlertService,
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
        await this.repository.acquireLock(userId);

        // 1. 프로모션 조회 (코드로 조회)
        const promotion = await this.repository.findByCode(code);
        if (!promotion) {
            throw new PromotionNotFoundException(code);
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
            throw new Error('Promotion usage limit exceeded');
        }

        // 10. 만료 시간 계산
        let expiresAt: Date | null = null;
        if (promotion.bonusExpiryMinutes) {
            expiresAt = new Date(now.getTime() + promotion.bonusExpiryMinutes * 60 * 1000);
        }

        // 11. 지갑 잔액 업데이트 (보너스 지급)
        const updateResult = await this.updateUserBalanceService.execute({
            userId,
            currency,
            balanceType: BalanceType.BONUS,
            operation: UpdateOperation.ADD,
            amount: bonusAmount,
        });

        // 12. 트랜잭션 기록 생성
        await this.createWalletTransactionService.execute({
            userId,
            type: TransactionType.BONUS,
            status: TransactionStatus.COMPLETED,
            currency,
            amount: bonusAmount,
            beforeBalance: updateResult.beforeMainBalance.add(updateResult.beforeBonusBalance),
            afterBalance: updateResult.afterMainBalance.add(updateResult.afterBonusBalance),
            balanceDetail: {
                mainBalanceChange: updateResult.mainBalanceChange,
                mainBeforeAmount: updateResult.beforeMainBalance,
                mainAfterAmount: updateResult.afterMainBalance,
                bonusBalanceChange: updateResult.bonusBalanceChange,
                bonusBeforeAmount: updateResult.beforeBonusBalance,
                bonusAfterAmount: updateResult.afterBonusBalance,
            },
            description: `Promotion Code: ${code}`,
            metadata: {
                promotionId: promotion.id.toString(),
                code,
                promotionType: 'COUPON',
            },
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
                requiredAmount: targetRollingAmount,
                userPromotionId: BigInt(userPromotion.id),
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

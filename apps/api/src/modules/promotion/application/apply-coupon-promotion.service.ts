// src/modules/promotion/application/apply-coupon-promotion.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { PromotionPolicy, PromotionNotFoundException, PromotionInvalidConfigurationException } from '../domain';
import type { UserPromotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports/out';
import type { PromotionRepositoryPort } from '../ports/out/promotion.repository.port';
import { CreateWageringRequirementService } from '../../wagering/application/create-wagering-requirement.service';
import type { RequestClientInfo } from 'src/common/http/types';

interface ApplyCouponPromotionParams {
    userId: bigint;
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
    ) { }

    @Transactional()
    async execute({
        userId,
        code,
        currency,
        now = new Date(),
        requestInfo,
    }: ApplyCouponPromotionParams): Promise<UserPromotion> {
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

        // 11. UserPromotion 생성
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

        // 12. 롤링 생성
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

        this.logger.log(
            `Coupon applied: userId=${userId}, code=${code}, bonusAmount=${bonusAmount.toString()}`,
        );

        return userPromotion;
    }
}

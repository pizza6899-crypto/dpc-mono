// src/modules/promotion/application/check-eligible-promotions.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import type { Promotion } from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

interface CheckEligiblePromotionsParams {
  userId: bigint;
  depositAmount: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
}

@Injectable()
export class CheckEligiblePromotionsService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
  ) { }

  async execute({
    userId,
    depositAmount,
    currency,
  }: CheckEligiblePromotionsParams): Promise<Promotion[]> {
    const activePromotions = await this.repository.findActivePromotions();
    const hasPreviousDeposits = await this.repository.hasPreviousDeposits(userId);
    const userParticipations = await this.repository.findUserPromotions(userId, 'ACTIVE');

    const eligiblePromotions: Promotion[] = [];

    for (const promotion of activePromotions) {
      try {
        const currencyRule = await this.repository.getCurrencyRule(promotion.id, currency);
        if (!currencyRule) continue;

        // 최소 입금 금액 확인
        if (depositAmount.lt(currencyRule.minDepositAmount)) continue;

        // 선착순 마감 확인
        if (promotion.maxUsageCount !== null && promotion.currentUsageCount >= promotion.maxUsageCount) {
          continue;
        }

        // 타겟 타입별 자격 확인 (New User 예시)
        if (promotion.targetType === 'NEW_USER_FIRST_DEPOSIT' && hasPreviousDeposits) {
          continue;
        }

        // 중복 참여 확인 (Active한 프로모션이 있으면 제외하는 등의 비즈니스 상식 적용)
        const isAlreadyParticipating = userParticipations.some(up => up.promotionId === promotion.id);
        if (isAlreadyParticipating) continue;

        eligiblePromotions.push(promotion);
      } catch (error) {
        continue;
      }
    }

    return eligiblePromotions;
  }
}

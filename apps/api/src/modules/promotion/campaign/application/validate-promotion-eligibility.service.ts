// src/modules/promotion/campaign/application/validate-promotion-eligibility.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import {
  Promotion,
  PromotionPolicy,
  PromotionNotFoundException,
  PromotionNotEligibleException,
} from '../domain';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';

interface ValidatePromotionEligibilityParams {
  userId: bigint;
  promotionId: bigint;
  depositAmount: Prisma.Decimal;
  currency: ExchangeCurrencyCode;
}

@Injectable()
export class ValidatePromotionEligibilityService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
    private readonly policy: PromotionPolicy,
  ) { }

  async execute(params: ValidatePromotionEligibilityParams): Promise<Promotion> {
    const { userId, promotionId, depositAmount, currency } = params;

    // 1. 프로모션 존재 확인
    const promotion = await this.repository.findById(promotionId);
    if (!promotion) {
      throw new PromotionNotFoundException();
    }

    // 2. 해당 통화에 대한 규칙 확인
    const currencyRule = await this.repository.getCurrencyRule(promotionId, currency);
    if (!currencyRule) {
      throw new PromotionNotEligibleException('Currency not supported for this promotion');
    }

    const now = new Date();
    const periodStart = promotion.getCurrentPeriodStartDate(now);

    const [
      depositCount,
      withdrawalCount,
      participationCountInPeriod,
      activeParticipations,
    ] = await Promise.all([
      this.repository.countCompletedDeposits(userId),
      this.repository.countCompletedWithdrawals(userId),
      this.repository.countUserPromotionsInPeriod({
        userId,
        promotionId,
        startDate: periodStart,
      }),
      this.repository.findUserPromotions(userId, 'ACTIVE'),
    ]);

    // 4. 도메인 정책을 통한 검증
    this.policy.validateEligibility({
      promotion,
      currencyRule,
      depositAmount,
      depositCount,
      withdrawalCount,
      participationCountInPeriod,
      activeParticipations,
      now,
    });

    return promotion;
  }
}

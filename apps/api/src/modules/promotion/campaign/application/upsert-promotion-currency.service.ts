// src/modules/promotion/campaign/application/upsert-promotion-currency.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { PROMOTION_REPOSITORY } from '../ports';
import type { PromotionRepositoryPort } from '../ports/promotion.repository.port';
import { PromotionNotFoundException, PromotionPolicy } from '../domain';

interface UpsertPromotionCurrencyParams {
  promotionId: bigint;
  currency: ExchangeCurrencyCode;
  minDepositAmount: string;
  maxDepositAmount?: string | null;
  maxBonusAmount?: string | null;
  maxWithdrawAmount?: string | null;
  bonusRate?: string | null;
  wageringMultiplier?: string | null;
}

@Injectable()
export class UpsertPromotionCurrencyService {
  constructor(
    @Inject(PROMOTION_REPOSITORY)
    private readonly repository: PromotionRepositoryPort,
    private readonly policy: PromotionPolicy,
  ) { }

  async execute(params: UpsertPromotionCurrencyParams): Promise<void> {
    const promotion = await this.repository.findById(params.promotionId);
    if (!promotion) {
      throw new PromotionNotFoundException();
    }

    // 도메인 레벨에서 설정들에 대한 종합 검증
    this.policy.validateConfiguration({
      currencyRules: [
        {
          minDepositAmount: new Prisma.Decimal(params.minDepositAmount),
          maxBonusAmount: params.maxBonusAmount ? new Prisma.Decimal(params.maxBonusAmount) : null,
          bonusRate: params.bonusRate ? new Prisma.Decimal(params.bonusRate) : null,
        },
      ],
    });

    await this.repository.upsertCurrencySettings({
      promotionId: params.promotionId,
      currency: params.currency,
      minDepositAmount: new Prisma.Decimal(params.minDepositAmount),
      maxDepositAmount: params.maxDepositAmount ? new Prisma.Decimal(params.maxDepositAmount) : null,
      maxBonusAmount: params.maxBonusAmount ? new Prisma.Decimal(params.maxBonusAmount) : null,
      maxWithdrawAmount: params.maxWithdrawAmount ? new Prisma.Decimal(params.maxWithdrawAmount) : null,
      bonusRate: params.bonusRate ? new Prisma.Decimal(params.bonusRate) : null,
      wageringMultiplier: params.wageringMultiplier ? new Prisma.Decimal(params.wageringMultiplier) : null,
    });
  }
}

// src/modules/promotion/domain/model/promotion-currency.entity.ts
import { Prisma, ExchangeCurrencyCode } from '@repo/database';

export class PromotionCurrency {
  private constructor(
    public readonly id: bigint,
    public readonly promotionId: bigint,
    public readonly currency: ExchangeCurrencyCode,
    public readonly minDepositAmount: Prisma.Decimal,
    public readonly maxBonusAmount: Prisma.Decimal | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  static fromPersistence(data: {
    id: bigint;
    promotionId: bigint;
    currency: ExchangeCurrencyCode;
    minDepositAmount: Prisma.Decimal;
    maxBonusAmount: Prisma.Decimal | null;
    createdAt: Date;
    updatedAt: Date;
  }): PromotionCurrency {
    return new PromotionCurrency(
      data.id,
      data.promotionId,
      data.currency,
      data.minDepositAmount,
      data.maxBonusAmount,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 입금 금액이 최소 입금 금액을 만족하는지 확인
   */
  validateMinDepositAmount(depositAmount: Prisma.Decimal): boolean {
    return depositAmount.gte(this.minDepositAmount);
  }

  /**
   * 보너스 금액이 최대 보너스 금액을 초과하지 않는지 확인
   */
  validateMaxBonusAmount(bonusAmount: Prisma.Decimal): boolean {
    if (!this.maxBonusAmount) {
      return true; // 최대 보너스 금액이 없으면 제한 없음
    }
    return bonusAmount.lte(this.maxBonusAmount);
  }

  toPersistence() {
    return {
      id: this.id,
      promotionId: this.promotionId,
      currency: this.currency,
      minDepositAmount: this.minDepositAmount,
      maxBonusAmount: this.maxBonusAmount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}


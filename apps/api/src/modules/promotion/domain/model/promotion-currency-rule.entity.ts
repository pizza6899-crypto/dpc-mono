// src/modules/promotion/domain/model/promotion-currency-rule.entity.ts
import { Prisma } from '@prisma/client';
import type { ExchangeCurrencyCode } from '@prisma/client';

export class PromotionCurrencyRule {
  private constructor(
    public readonly id: bigint,
    public readonly promotionId: bigint,
    public readonly currency: ExchangeCurrencyCode,
    public readonly minDepositAmount: Prisma.Decimal,
    public readonly maxDepositAmount: Prisma.Decimal | null,
    public readonly maxBonusAmount: Prisma.Decimal | null,
    public readonly maxWithdrawAmount: Prisma.Decimal | null,
    public readonly bonusRate: Prisma.Decimal | null,
    public readonly wageringMultiplier: Prisma.Decimal | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly updatedBy: bigint | null,
  ) { }

  static fromPersistence(data: {
    id: bigint;
    promotionId: bigint;
    currency: ExchangeCurrencyCode;
    minDepositAmount: Prisma.Decimal;
    maxDepositAmount: Prisma.Decimal | null;
    maxBonusAmount: Prisma.Decimal | null;
    maxWithdrawAmount: Prisma.Decimal | null;
    bonusRate: Prisma.Decimal | null;
    wageringMultiplier: Prisma.Decimal | null;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: bigint | null;
  }): PromotionCurrencyRule {
    return new PromotionCurrencyRule(
      data.id,
      data.promotionId,
      data.currency,
      data.minDepositAmount,
      data.maxDepositAmount,
      data.maxBonusAmount,
      data.maxWithdrawAmount,
      data.bonusRate,
      data.wageringMultiplier,
      data.createdAt,
      data.updatedAt,
      data.updatedBy,
    );
  }

  /**
   * 입금 금액이 정책(최소/최대 입금액)을 만족하는지 확인
   */
  validateDepositAmount(depositAmount: Prisma.Decimal): boolean {
    if (depositAmount.lt(this.minDepositAmount)) return false;
    if (this.maxDepositAmount && depositAmount.gt(this.maxDepositAmount)) return false;
    return true;
  }

  /**
   * 보너스 금액 계산 (PERCENTAGE 방식 고정)
   */
  calculateBonusAmount(depositAmount: Prisma.Decimal): Prisma.Decimal {
    if (!this.bonusRate) return new Prisma.Decimal(0);

    let bonus = depositAmount.mul(this.bonusRate);

    // 최대 보너스 한도 적용
    if (this.maxBonusAmount && bonus.gt(this.maxBonusAmount)) {
      bonus = this.maxBonusAmount;
    }

    return bonus;
  }

  toPersistence() {
    return {
      id: this.id,
      promotionId: this.promotionId,
      currency: this.currency,
      minDepositAmount: this.minDepositAmount,
      maxDepositAmount: this.maxDepositAmount,
      maxBonusAmount: this.maxBonusAmount,
      maxWithdrawAmount: this.maxWithdrawAmount,
      bonusRate: this.bonusRate,
      wageringMultiplier: this.wageringMultiplier,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      updatedBy: this.updatedBy,
    };
  }
}

// src/modules/promotion/campaign/domain/model/user-promotion.entity.ts
import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { UserPromotionStatus } from '@prisma/client';

export interface PromotionPolicySnapshot {
  bonusRate: number | null;
  wageringMultiplier: number | null;
  maxWithdrawAmount: number | null;
}

export class UserPromotion {
  private constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly promotionId: bigint,
    public readonly depositId: bigint | null,
    public readonly wageringRequirementId: bigint | null,
    private _status: UserPromotionStatus,
    public readonly depositAmount: Prisma.Decimal,
    public readonly bonusAmount: Prisma.Decimal,
    public readonly currency: ExchangeCurrencyCode,
    public readonly policySnapshot: PromotionPolicySnapshot,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly completedAt: Date | null,
    public readonly voidedAt: Date | null,
  ) {}

  static fromPersistence(data: {
    id: bigint;
    userId: bigint;
    promotionId: bigint;
    depositId: bigint | null;
    wageringRequirementId: bigint | null;
    status: UserPromotionStatus;
    depositAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    policySnapshot: any; // Prisma.JsonValue
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date | null;
    voidedAt: Date | null;
  }): UserPromotion {
    return new UserPromotion(
      data.id,
      data.userId,
      data.promotionId,
      data.depositId,
      data.wageringRequirementId,
      data.status,
      data.depositAmount,
      data.bonusAmount,
      data.currency,
      data.policySnapshot as PromotionPolicySnapshot,
      data.createdAt,
      data.updatedAt,
      data.completedAt,
      data.voidedAt,
    );
  }

  get status(): UserPromotionStatus {
    return this._status;
  }

  isActive(): boolean {
    return this._status === UserPromotionStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this._status === UserPromotionStatus.COMPLETED;
  }

  markAsCompleted(): void {
    this._status = UserPromotionStatus.COMPLETED;
    (this as any).completedAt = new Date();
  }

  markAsVoided(): void {
    this._status = UserPromotionStatus.VOIDED;
    (this as any).voidedAt = new Date();
  }

  markAsExpired(): void {
    this._status = UserPromotionStatus.EXPIRED;
  }

  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      promotionId: this.promotionId,
      depositId: this.depositId,
      wageringRequirementId: this.wageringRequirementId,
      status: this._status,
      depositAmount: this.depositAmount,
      bonusAmount: this.bonusAmount,
      currency: this.currency,
      policySnapshot: this.policySnapshot as any,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      completedAt: this.completedAt,
      voidedAt: this.voidedAt,
    };
  }
}

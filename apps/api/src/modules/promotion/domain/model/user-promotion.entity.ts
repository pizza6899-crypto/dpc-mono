// src/modules/promotion/domain/model/user-promotion.entity.ts
import { Prisma, ExchangeCurrencyCode } from '@repo/database';
import { UserPromotionStatus } from '@repo/database';

export class UserPromotion {
  private constructor(
    public readonly id: number,
    public readonly userId: bigint,
    public readonly promotionId: number,
    private _status: UserPromotionStatus,
    public readonly depositAmount: Prisma.Decimal,
    public readonly bonusAmount: Prisma.Decimal,
    public readonly targetRollingAmount: Prisma.Decimal,
    private _currentRollingAmount: Prisma.Decimal,
    public readonly currency: ExchangeCurrencyCode,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static fromPersistence(data: {
    id: number;
    userId: bigint;
    promotionId: number;
    status: UserPromotionStatus;
    depositAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    targetRollingAmount: Prisma.Decimal;
    currentRollingAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    createdAt: Date;
    updatedAt: Date;
  }): UserPromotion {
    return new UserPromotion(
      data.id,
      data.userId,
      data.promotionId,
      data.status,
      data.depositAmount,
      data.bonusAmount,
      data.targetRollingAmount,
      data.currentRollingAmount,
      data.currency,
      data.createdAt,
      data.updatedAt,
    );
  }

  get status(): UserPromotionStatus {
    return this._status;
  }

  get currentRollingAmount(): Prisma.Decimal {
    return this._currentRollingAmount;
  }

  get bonusGranted(): boolean {
    // bonusAmount가 0보다 크면 보너스 지급된 것으로 간주
    return this.bonusAmount.gt(0);
  }

  setRollingAmount(amount: Prisma.Decimal): void {
    this._currentRollingAmount = amount;
  }

  addRollingAmount(amount: Prisma.Decimal): void {
    this._currentRollingAmount = this._currentRollingAmount.add(amount);
  }

  isRollingCompleted(): boolean {
    return this._currentRollingAmount.gte(this.targetRollingAmount);
  }

  markAsCompleted(): void {
    this._status = UserPromotionStatus.COMPLETED;
  }

  markAsQualificationLost(): void {
    this._status = UserPromotionStatus.QUALIFICATION_LOST;
  }

  markAsExpired(): void {
    this._status = UserPromotionStatus.EXPIRED;
  }

  markAsFailed(): void {
    this._status = UserPromotionStatus.FAILED;
  }

  isActive(): boolean {
    return this._status === UserPromotionStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this._status === UserPromotionStatus.COMPLETED;
  }

  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      promotionId: this.promotionId,
      status: this._status,
      depositAmount: this.depositAmount,
      bonusAmount: this.bonusAmount,
      targetRollingAmount: this.targetRollingAmount,
      currentRollingAmount: this._currentRollingAmount,
      currency: this.currency,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}


// src/modules/promotion/domain/model/user-promotion.entity.ts
import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { UserPromotionStatus } from '@prisma/client';

export class UserPromotion {
  private constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly promotionId: bigint,
    private _status: UserPromotionStatus,
    public readonly depositAmount: Prisma.Decimal,
    private _lockedAmount: Prisma.Decimal,
    public readonly bonusAmount: Prisma.Decimal,
    public readonly targetRollingAmount: Prisma.Decimal,
    private _currentRollingAmount: Prisma.Decimal,
    public readonly currency: ExchangeCurrencyCode,
    public readonly expiresAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly promotionCode?: string | null,
  ) { }

  static fromPersistence(data: {
    id: bigint;
    userId: bigint;
    promotionId: bigint;
    status: UserPromotionStatus;
    depositAmount: Prisma.Decimal;
    lockedAmount: Prisma.Decimal;
    bonusAmount: Prisma.Decimal;
    targetRollingAmount: Prisma.Decimal;
    currentRollingAmount: Prisma.Decimal;
    currency: ExchangeCurrencyCode;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    promotionCode?: string | null;
  }): UserPromotion {
    return new UserPromotion(
      data.id,
      data.userId,
      data.promotionId,
      data.status,
      data.depositAmount,
      data.lockedAmount,
      data.bonusAmount,
      data.targetRollingAmount,
      data.currentRollingAmount,
      data.currency,
      data.expiresAt,
      data.createdAt,
      data.updatedAt,
      data.promotionCode,
    );
  }

  get lockedAmount(): Prisma.Decimal {
    return this._lockedAmount;
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

  isExpired(now: Date = new Date()): boolean {
    if (this.expiresAt && now > this.expiresAt) {
      return true;
    }
    return this._status === UserPromotionStatus.EXPIRED;
  }

  unlock(): void {
    this._lockedAmount = new Prisma.Decimal(0);
  }

  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      promotionId: this.promotionId,
      status: this._status,
      depositAmount: this.depositAmount,
      lockedAmount: this._lockedAmount,
      bonusAmount: this.bonusAmount,
      targetRollingAmount: this.targetRollingAmount,
      currentRollingAmount: this._currentRollingAmount,
      currency: this.currency,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

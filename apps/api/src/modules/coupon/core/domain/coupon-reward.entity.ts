import { Prisma, RewardItemType, ExchangeCurrencyCode } from '@prisma/client';

export class CouponReward {
  private constructor(
    public readonly id: bigint,
    public readonly couponId: bigint,
    private _rewardType: RewardItemType,
    private _currency: ExchangeCurrencyCode,
    private _amount: Prisma.Decimal,
    private _wageringMultiplier: Prisma.Decimal | null,
    private _maxCashConversion: Prisma.Decimal | null,
  ) { }

  get rewardType(): RewardItemType { return this._rewardType; }
  get currency(): ExchangeCurrencyCode { return this._currency; }
  get amount(): Prisma.Decimal { return this._amount; }
  get wageringMultiplier(): Prisma.Decimal | null { return this._wageringMultiplier; }
  get maxCashConversion(): Prisma.Decimal | null { return this._maxCashConversion; }

  static create(params: {
    id?: bigint;
    couponId: bigint;
    rewardType: RewardItemType;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    wageringMultiplier?: Prisma.Decimal | null;
    maxCashConversion?: Prisma.Decimal | null;
  }): CouponReward {
    return new CouponReward(
      params.id ?? 0n,
      params.couponId,
      params.rewardType,
      params.currency,
      params.amount,
      params.wageringMultiplier ?? null,
      params.maxCashConversion ?? null,
    );
  }

  static fromPersistence(data: {
    id: bigint;
    couponId: bigint;
    rewardType: RewardItemType;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    wageringMultiplier: Prisma.Decimal | null;
    maxCashConversion: Prisma.Decimal | null;
  }): CouponReward {
    return new CouponReward(
      data.id,
      data.couponId,
      data.rewardType,
      data.currency,
      data.amount,
      data.wageringMultiplier,
      data.maxCashConversion,
    );
  }

  toPersistence() {
    return {
      id: this.id,
      couponId: this.couponId,
      rewardType: this._rewardType,
      currency: this._currency,
      amount: this._amount,
      wageringMultiplier: this._wageringMultiplier,
      maxCashConversion: this._maxCashConversion,
    };
  }
}

import { RewardItemType, ExchangeCurrencyCode } from '@prisma/client';

export class CouponReward {
  private constructor(
    public readonly id: bigint,
    public readonly couponId: bigint,
    private _rewardType: RewardItemType,
    private _currency: ExchangeCurrencyCode,
    private _amount: number | string, // 도메인에서는 단순 값으로 처리 (Prisma 의존성 최소화)
    private _wageringMultiplier: number | string | null,
    private _maxCashConversion: number | string | null,
  ) { }

  get rewardType(): RewardItemType { return this._rewardType; }
  get currency(): ExchangeCurrencyCode { return this._currency; }
  get amount(): number | string { return this._amount; }
  get wageringMultiplier(): number | string | null { return this._wageringMultiplier; }
  get maxCashConversion(): number | string | null { return this._maxCashConversion; }

  static create(params: {
    id?: bigint;
    couponId: bigint;
    rewardType: RewardItemType;
    currency: ExchangeCurrencyCode;
    amount: number | string;
    wageringMultiplier?: number | string | null;
    maxCashConversion?: number | string | null;
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

  static reconstitute(params: {
    id: bigint;
    couponId: bigint;
    rewardType: RewardItemType;
    currency: ExchangeCurrencyCode;
    amount: number | string;
    wageringMultiplier: number | string | null;
    maxCashConversion: number | string | null;
  }): CouponReward {
    return new CouponReward(
      params.id,
      params.couponId,
      params.rewardType,
      params.currency,
      params.amount,
      params.wageringMultiplier,
      params.maxCashConversion,
    );
  }
}

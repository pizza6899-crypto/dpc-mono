import { Injectable, Inject } from '@nestjs/common';
import { COUPON_REPOSITORY_TOKEN } from '../ports/coupon.repository.token';
import type { CouponRepositoryPort } from '../ports/coupon.repository.port';
import { Coupon, CouponMetadata } from '../domain/coupon.entity';
import { CouponReward } from '../domain/coupon-reward.entity';
import { Prisma, RewardItemType, ExchangeCurrencyCode } from '@prisma/client';

export interface CreateCouponParams {
  code: string;
  metadata?: CouponMetadata;
  isAllowlistOnly?: boolean;
  maxUsage?: number;
  maxUsagePerUser?: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  createdBy: bigint;
  rewards: {
    rewardType: RewardItemType;
    currency: ExchangeCurrencyCode;
    amount: Prisma.Decimal;
    wageringMultiplier?: Prisma.Decimal | null;
    maxCashConversion?: Prisma.Decimal | null;
  }[];
}

@Injectable()
export class CreateCouponService {
  constructor(
    @Inject(COUPON_REPOSITORY_TOKEN)
    private readonly couponRepository: CouponRepositoryPort,
  ) { }

  async execute(params: CreateCouponParams): Promise<Coupon> {
    const coupon = Coupon.create({
      code: params.code,
      metadata: params.metadata,
      isAllowlistOnly: params.isAllowlistOnly,
      maxUsage: params.maxUsage,
      maxUsagePerUser: params.maxUsagePerUser,
      startsAt: params.startsAt,
      expiresAt: params.expiresAt,
      createdBy: params.createdBy,
    });

    const rewards = params.rewards.map(r =>
      CouponReward.create({
        couponId: coupon.id,
        rewardType: r.rewardType,
        currency: r.currency,
        amount: r.amount,
        wageringMultiplier: r.wageringMultiplier,
        maxCashConversion: r.maxCashConversion,
      })
    );

    // In a more complex scenario, I'd add rewards to the coupon entity if it's an aggregate root that manages its children's state.
    // For now, I'm assuming the repository handles the aggregate saving.

    // In our Coupon entity design, rewards are part of the aggregate.
    (coupon as any)._rewards = rewards; // Using any for simplify, or could use an protected method.

    await this.couponRepository.save(coupon);
    return coupon;
  }
}

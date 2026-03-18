import {
  Coupon as PrismaCoupon,
  CouponReward as PrismaCouponReward,
  CouponAllowlist as PrismaCouponAllowlist,
  Prisma,
} from '@prisma/client';
import { Coupon } from '../domain/coupon.entity';
import { CouponReward } from '../domain/coupon-reward.entity';
import { CouponAllowlist } from '../domain/coupon-allowlist.entity';

export type PrismaCouponWithRelations = PrismaCoupon & {
  rewards?: PrismaCouponReward[];
  allowlists?: PrismaCouponAllowlist[];
};

export class CouponMapper {
  static toDomain(prismaCoupon: PrismaCouponWithRelations): Coupon {
    const rewards = (prismaCoupon.rewards || []).map((reward) =>
      CouponReward.fromPersistence({
        id: reward.id,
        couponId: reward.couponId,
        rewardType: reward.rewardType,
        currency: reward.currency,
        amount: reward.amount,
        wageringMultiplier: reward.wageringMultiplier,
        maxCashConversion: reward.maxCashConversion,
      }),
    );

    const allowlists = (prismaCoupon.allowlists || []).map((allowlist) =>
      CouponAllowlist.fromPersistence({
        id: allowlist.id,
        couponId: allowlist.couponId,
        userId: allowlist.userId,
        createdAt: allowlist.createdAt,
      }),
    );

    return Coupon.fromPersistence({
      id: prismaCoupon.id,
      code: prismaCoupon.code,
      metadata: prismaCoupon.metadata,
      isAllowlistOnly: prismaCoupon.isAllowlistOnly,
      maxUsage: prismaCoupon.maxUsage,
      usageCount: prismaCoupon.usageCount,
      maxUsagePerUser: prismaCoupon.maxUsagePerUser,
      status: prismaCoupon.status,
      startsAt: prismaCoupon.startsAt,
      expiresAt: prismaCoupon.expiresAt,
      createdAt: prismaCoupon.createdAt,
      updatedAt: prismaCoupon.updatedAt,
      createdBy: prismaCoupon.createdBy,
      updatedBy: prismaCoupon.updatedBy,
      rewards,
      allowlists,
    });
  }

  static toPrisma(domainCoupon: Coupon) {
    return {
      code: domainCoupon.code,
      metadata: (domainCoupon.metadata as Prisma.InputJsonValue) ?? undefined,
      isAllowlistOnly: domainCoupon.isAllowlistOnly,
      maxUsage: domainCoupon.maxUsage,
      usageCount: domainCoupon.usageCount,
      maxUsagePerUser: domainCoupon.maxUsagePerUser,
      status: domainCoupon.status,
      startsAt: domainCoupon.startsAt ?? undefined,
      expiresAt: domainCoupon.expiresAt ?? undefined,
      createdBy: domainCoupon.createdBy ?? undefined,
      updatedBy: domainCoupon.updatedBy ?? undefined,
    };
  }

  static toRewardCreateInput(rewards: CouponReward[]): Prisma.CouponRewardCreateManyCouponInput[] {
    return rewards.map(r => ({
      rewardType: r.rewardType,
      currency: r.currency,
      amount: new Prisma.Decimal(r.amount.toString()),
      wageringMultiplier: r.wageringMultiplier ? new Prisma.Decimal(r.wageringMultiplier.toString()) : null,
      maxCashConversion: r.maxCashConversion ? new Prisma.Decimal(r.maxCashConversion.toString()) : null,
    }));
  }

  static toAllowlistCreateInput(allowlists: CouponAllowlist[]): Prisma.CouponAllowlistCreateManyCouponInput[] {
    return allowlists.map(a => ({
      userId: a.userId,
    }));
  }
}

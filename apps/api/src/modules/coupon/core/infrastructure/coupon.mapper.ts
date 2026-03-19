import {
  Coupon as PrismaCoupon,
  CouponReward as PrismaCouponReward,
} from '@prisma/client';
import { Coupon } from '../domain/coupon.entity';
import { CouponMetadata } from '../domain/coupon.types';

export type PrismaCouponWithRewards = PrismaCoupon & {
  rewards: PrismaCouponReward[];
};

export class CouponMapper {
  /**
   * Prisma DB 모델을 도메인 엔티티로 변환
   */
  static toDomain(prismaCoupon: PrismaCouponWithRewards): Coupon {
    return Coupon.fromPersistence({
      id: prismaCoupon.id,
      code: prismaCoupon.code,
      metadata: prismaCoupon.metadata as unknown as CouponMetadata,
      isAllowlistOnly: prismaCoupon.isAllowlistOnly,
      maxUsage: prismaCoupon.maxUsage,
      usageCount: prismaCoupon.usageCount,
      maxUsagePerUser: prismaCoupon.maxUsagePerUser,
      status: prismaCoupon.status,
      startsAt: prismaCoupon.startsAt,
      expiresAt: prismaCoupon.expiresAt,
      rewards: prismaCoupon.rewards.map((r) => ({
        rewardType: r.rewardType,
        currency: r.currency,
        amount: r.amount,
        wageringMultiplier: r.wageringMultiplier,
        maxCashConversion: r.maxCashConversion,
      })),
      createdBy: prismaCoupon.createdBy,
      updatedBy: prismaCoupon.updatedBy,
      createdAt: prismaCoupon.createdAt,
      updatedAt: prismaCoupon.updatedAt,
    });
  }

  /**
   * 도메인 엔티티를 Prisma DB 데이터로 변환 (저장용)
   */
  static toPrisma(coupon: Coupon): any {
    const props = coupon.toProps();
    return {
      code: props.code,
      metadata: props.metadata as any,
      isAllowlistOnly: props.isAllowlistOnly,
      maxUsage: props.maxUsage,
      usageCount: props.usageCount,
      maxUsagePerUser: props.maxUsagePerUser,
      status: props.status,
      startsAt: props.startsAt,
      expiresAt: props.expiresAt,
      createdBy: props.createdBy,
      updatedBy: props.updatedBy,
    };
  }

  /**
   * 보상 정보만 Prisma 형식으로 변환 (create/update 시 관계 처리에 사용)
   */
  static toPrismaRewards(coupon: Coupon) {
    return coupon.rewards.map((r) => ({
      rewardType: r.rewardType,
      currency: r.currency,
      amount: r.amount,
      wageringMultiplier: r.wageringMultiplier,
      maxCashConversion: r.maxCashConversion,
    }));
  }
}

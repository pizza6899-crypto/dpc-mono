import { CouponConfig as PrismaCouponConfig } from '@prisma/client';
import { CouponConfig } from '../domain/coupon-config.entity';

export class CouponConfigMapper {
  static toDomain(prismaConfig: PrismaCouponConfig): CouponConfig {
    return CouponConfig.fromPersistence({
      id: prismaConfig.id,
      isCouponEnabled: prismaConfig.isCouponEnabled,
      maxDailyAttemptsPerUser: prismaConfig.maxDailyAttemptsPerUser,
      defaultExpiryDays: prismaConfig.defaultExpiryDays,
      updatedAt: prismaConfig.updatedAt,
      updatedBy: prismaConfig.updatedBy,
    });
  }

  static toPrisma(domainConfig: CouponConfig): Partial<PrismaCouponConfig> {
    const props = domainConfig.toProps();
    return {
      isCouponEnabled: props.isCouponEnabled,
      maxDailyAttemptsPerUser: props.maxDailyAttemptsPerUser,
      defaultExpiryDays: props.defaultExpiryDays,
      updatedBy: props.updatedBy,
    };
  }
}

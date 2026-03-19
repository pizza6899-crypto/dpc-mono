import { UserCoupon as PrismaUserCoupon } from '@prisma/client';
import { UserCoupon } from '../domain/user-coupon.entity';

export class UserCouponMapper {
  static toDomain(prismaUserCoupon: PrismaUserCoupon): UserCoupon {
    return UserCoupon.reconstitute({
      id: prismaUserCoupon.id,
      couponId: prismaUserCoupon.couponId,
      userId: prismaUserCoupon.userId,
      usedAt: prismaUserCoupon.usedAt,
    });
  }

  static toPersistence(domainUserCoupon: UserCoupon): PrismaUserCoupon {
    return {
      id: domainUserCoupon.id,
      couponId: domainUserCoupon.couponId,
      userId: domainUserCoupon.userId,
      usedAt: domainUserCoupon.usedAt,
    };
  }
}

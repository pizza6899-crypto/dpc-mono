import { UserCoupon } from '../domain/user-coupon.entity';

export interface UserCouponRepositoryPort {
  findById(id: bigint): Promise<UserCoupon | null>;
  findByUserIdAndCouponId(userId: bigint, couponId: bigint): Promise<UserCoupon | null>;
  countByUserIdAndCouponId(userId: bigint, couponId: bigint): Promise<number>;
  save(userCoupon: UserCoupon): Promise<void>;
}

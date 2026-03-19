export interface UserCouponRepositoryPort {
  /**
   * 특정 유저가 특정 쿠폰을 사용한 횟수를 조회합니다.
   */
  countUserCouponUsage(userId: bigint, couponId: bigint): Promise<number>;

  /**
   * 쿠폰 사용 이력을 기록합니다.
   */
  recordUsage(params: {
    id: bigint;
    userId: bigint;
    couponId: bigint;
    usedAt: Date;
  }): Promise<void>;
}

export const USER_COUPON_REPOSITORY_TOKEN = Symbol(
  'USER_COUPON_REPOSITORY_TOKEN',
);

export class UserCoupon {
  private constructor(
    public readonly id: bigint,
    public readonly couponId: bigint,
    public readonly userId: bigint,
    public readonly usedAt: Date,
  ) { }

  /**
   * 새로운 쿠폰 사용 이력 생성
   */
  static create(params: {
    id: bigint; // Snowflake ID
    couponId: bigint;
    userId: bigint;
    usedAt: Date;
  }): UserCoupon {
    return new UserCoupon(
      params.id,
      params.couponId,
      params.userId,
      params.usedAt,
    );
  }

  /**
   * DB 데이터로부터 도메인 객체 재구성
   */
  static reconstitute(params: {
    id: bigint;
    couponId: bigint;
    userId: bigint;
    usedAt: Date;
  }): UserCoupon {
    return new UserCoupon(
      params.id,
      params.couponId,
      params.userId,
      params.usedAt,
    );
  }
}

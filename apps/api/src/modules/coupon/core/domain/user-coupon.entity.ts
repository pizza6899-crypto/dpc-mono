export class UserCoupon {
  private constructor(
    public readonly id: bigint,
    public readonly couponId: bigint,
    public readonly userId: bigint,
    public readonly usedAt: Date,
  ) { }

  static create(params: {
    id: bigint; // Snowflake ID (반드시 외부에서 생성 후 주입)
    couponId: bigint;
    userId: bigint;
    usedAt: Date; // 파티셔닝 정합성을 위해 Snowflake 생성 시점 일자 필수 권장
  }): UserCoupon {
    return new UserCoupon(
      params.id,
      params.couponId,
      params.userId,
      params.usedAt,
    );
  }

  static fromPersistence(data: {
    id: bigint;
    couponId: bigint;
    userId: bigint;
    usedAt: Date;
  }): UserCoupon {
    return new UserCoupon(
      data.id,
      data.couponId,
      data.userId,
      data.usedAt,
    );
  }

  toPersistence() {
    return {
      id: this.id,
      couponId: this.couponId,
      userId: this.userId,
      usedAt: this.usedAt,
    };
  }
}

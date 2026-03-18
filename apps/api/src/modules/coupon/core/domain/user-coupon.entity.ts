export class UserCoupon {
  private constructor(
    public readonly id: bigint,
    public readonly couponId: bigint,
    public readonly userId: bigint,
    public readonly usedAt: Date,
  ) { }

  static create(params: {
    id: bigint; // Snowflake ID (usually provided from outside create logic or generator)
    couponId: bigint;
    userId: bigint;
  }): UserCoupon {
    return new UserCoupon(
      params.id,
      params.couponId,
      params.userId,
      new Date(),
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

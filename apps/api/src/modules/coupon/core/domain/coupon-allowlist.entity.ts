export class CouponAllowlist {
  private constructor(
    public readonly id: bigint,
    public readonly couponId: bigint,
    public readonly userId: bigint,
    public readonly createdAt: Date,
  ) { }

  static create(params: {
    id?: bigint;
    couponId: bigint;
    userId: bigint;
  }): CouponAllowlist {
    return new CouponAllowlist(
      params.id ?? 0n,
      params.couponId,
      params.userId,
      new Date(),
    );
  }

  static fromPersistence(data: {
    id: bigint;
    couponId: bigint;
    userId: bigint;
    createdAt: Date;
  }): CouponAllowlist {
    return new CouponAllowlist(
      data.id,
      data.couponId,
      data.userId,
      data.createdAt,
    );
  }

  toPersistence() {
    return {
      id: this.id,
      couponId: this.couponId,
      userId: this.userId,
      createdAt: this.createdAt,
    };
  }
}

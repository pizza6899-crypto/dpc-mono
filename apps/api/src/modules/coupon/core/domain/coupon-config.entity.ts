export class CouponConfig {
  private constructor(
    public readonly id: number,
    private _isCouponEnabled: boolean,
    private _maxDailyAttemptsPerUser: number,
    private _defaultExpiryDays: number,
    private _updatedAt: Date,
    public readonly updatedBy: bigint | null,
  ) { }

  get isCouponEnabled(): boolean {
    return this._isCouponEnabled;
  }
  get maxDailyAttemptsPerUser(): number {
    return this._maxDailyAttemptsPerUser;
  }
  get defaultExpiryDays(): number {
    return this._defaultExpiryDays;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  update(params: {
    isCouponEnabled?: boolean;
    maxDailyAttemptsPerUser?: number;
    defaultExpiryDays?: number;
  }): void {
    if (params.isCouponEnabled !== undefined) {
      this._isCouponEnabled = params.isCouponEnabled;
    }
    if (params.maxDailyAttemptsPerUser !== undefined) {
      this._maxDailyAttemptsPerUser = params.maxDailyAttemptsPerUser;
    }
    if (params.defaultExpiryDays !== undefined) {
      this._defaultExpiryDays = params.defaultExpiryDays;
    }
    this._updatedAt = new Date();
  }

  static create(params: {
    id?: number;
    isCouponEnabled?: boolean;
    maxDailyAttemptsPerUser?: number;
    defaultExpiryDays?: number;
    updatedBy?: bigint | null;
  }): CouponConfig {
    return new CouponConfig(
      params.id ?? 1,
      params.isCouponEnabled ?? true,
      params.maxDailyAttemptsPerUser ?? 10,
      params.defaultExpiryDays ?? 30,
      new Date(),
      params.updatedBy ?? null,
    );
  }

  static fromPersistence(data: {
    id: number;
    isCouponEnabled: boolean;
    maxDailyAttemptsPerUser: number;
    defaultExpiryDays: number;
    updatedAt: Date;
    updatedBy: bigint | null;
  }): CouponConfig {
    return new CouponConfig(
      data.id,
      data.isCouponEnabled,
      data.maxDailyAttemptsPerUser,
      data.defaultExpiryDays,
      data.updatedAt,
      data.updatedBy,
    );
  }

  toPersistence() {
    return {
      id: this.id,
      isCouponEnabled: this._isCouponEnabled,
      maxDailyAttemptsPerUser: this._maxDailyAttemptsPerUser,
      defaultExpiryDays: this._defaultExpiryDays,
      updatedAt: this._updatedAt,
      updatedBy: this.updatedBy,
    };
  }
}

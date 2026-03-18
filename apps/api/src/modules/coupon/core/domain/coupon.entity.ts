import { Prisma, CouponStatus } from '@prisma/client';
import { CouponReward } from './coupon-reward.entity';
import { CouponAllowlist } from './coupon-allowlist.entity';
import {
  CouponExhaustedException,
  CouponExpiredException,
  CouponUserNotAllowedException,
  CouponUserUsageExceededException,
  CouponException,
} from './coupon.exception';

export class Coupon {
  private constructor(
    public readonly id: bigint,
    private _code: string,
    private _metadata: Prisma.JsonValue | null,
    private _isAllowlistOnly: boolean,
    private _maxUsage: number,
    private _usageCount: number,
    private _maxUsagePerUser: number,
    private _status: CouponStatus,
    private _startsAt: Date | null,
    private _expiresAt: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    private readonly _rewards: CouponReward[],
    private readonly _allowlists: CouponAllowlist[],
  ) { }

  get code(): string { return this._code; }
  get metadata(): Prisma.JsonValue | null { return this._metadata; }
  get isAllowlistOnly(): boolean { return this._isAllowlistOnly; }
  get maxUsage(): number { return this._maxUsage; }
  get usageCount(): number { return this._usageCount; }
  get maxUsagePerUser(): number { return this._maxUsagePerUser; }
  get status(): CouponStatus { return this._status; }
  get startsAt(): Date | null { return this._startsAt; }
  get expiresAt(): Date | null { return this._expiresAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get rewards(): CouponReward[] { return [...this._rewards]; }
  get allowlists(): CouponAllowlist[] { return [...this._allowlists]; }

  validateEligibility(userId: bigint, userUsageCount: number): void {
    if (this._status !== 'ACTIVE') {
      throw new CouponException(`Coupon is not active (Status: ${this._status})`);
    }

    const now = new Date();
    if (this._startsAt && now < this._startsAt) {
      throw new CouponException('Coupon has not started yet');
    }
    if (this._expiresAt && now > this._expiresAt) {
      throw new CouponExpiredException();
    }

    if (this._maxUsage > 0 && this._usageCount >= this._maxUsage) {
      throw new CouponExhaustedException();
    }

    if (userUsageCount >= this._maxUsagePerUser) {
      throw new CouponUserUsageExceededException();
    }

    if (this._isAllowlistOnly) {
      const allowed = this._allowlists.some(a => a.userId === userId);
      if (!allowed) {
        throw new CouponUserNotAllowedException();
      }
    }
  }

  get isActive(): boolean {
    if (this._status !== 'ACTIVE') return false;
    const now = new Date();
    if (this._startsAt && now < this._startsAt) return false;
    if (this._expiresAt && now > this._expiresAt) return false;
    if (this._maxUsage > 0 && this._usageCount >= this._maxUsage) return false;
    return true;
  }

  incrementUsage(): void {
    if (this._maxUsage > 0 && this._usageCount >= this._maxUsage) {
      throw new CouponExhaustedException();
    }
    this._usageCount++;
    this._updatedAt = new Date();
  }

  update(params: {
    metadata?: Prisma.JsonValue;
    isAllowlistOnly?: boolean;
    maxUsage?: number;
    maxUsagePerUser?: number;
    status?: CouponStatus;
    startsAt?: Date | null;
    expiresAt?: Date | null;
  }): void {
    if (params.metadata !== undefined) this._metadata = params.metadata;
    if (params.isAllowlistOnly !== undefined) this._isAllowlistOnly = params.isAllowlistOnly;
    if (params.maxUsage !== undefined) this._maxUsage = params.maxUsage;
    if (params.maxUsagePerUser !== undefined) this._maxUsagePerUser = params.maxUsagePerUser;
    if (params.status !== undefined) this._status = params.status;
    if (params.startsAt !== undefined) this._startsAt = params.startsAt;
    if (params.expiresAt !== undefined) this._expiresAt = params.expiresAt;
    this._updatedAt = new Date();
  }

  static create(params: {
    id?: bigint;
    code: string;
    metadata?: Prisma.JsonValue;
    isAllowlistOnly?: boolean;
    maxUsage?: number;
    maxUsagePerUser?: number;
    startsAt?: Date | null;
    expiresAt?: Date | null;
    createdBy?: bigint | null;
    rewards?: CouponReward[];
    allowlists?: CouponAllowlist[];
  }): Coupon {
    return new Coupon(
      params.id ?? 0n,
      params.code,
      params.metadata ?? null,
      params.isAllowlistOnly ?? false,
      params.maxUsage ?? 0,
      0, // usageCount
      params.maxUsagePerUser ?? 1,
      'ACTIVE',
      params.startsAt ?? null,
      params.expiresAt ?? null,
      new Date(),
      new Date(),
      params.createdBy ?? null,
      null, // updatedBy
      params.rewards ?? [],
      params.allowlists ?? [],
    );
  }

  static fromPersistence(data: {
    id: bigint;
    code: string;
    metadata: Prisma.JsonValue | null;
    isAllowlistOnly: boolean;
    maxUsage: number;
    usageCount: number;
    maxUsagePerUser: number;
    status: CouponStatus;
    startsAt: Date | null;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: bigint | null;
    updatedBy: bigint | null;
    rewards: CouponReward[];
    allowlists: CouponAllowlist[];
  }): Coupon {
    return new Coupon(
      data.id,
      data.code,
      data.metadata,
      data.isAllowlistOnly,
      data.maxUsage,
      data.usageCount,
      data.maxUsagePerUser,
      data.status,
      data.startsAt,
      data.expiresAt,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
      data.updatedBy,
      data.rewards,
      data.allowlists,
    );
  }

  toPersistence() {
    return {
      id: this.id,
      code: this._code,
      metadata: this._metadata,
      isAllowlistOnly: this._isAllowlistOnly,
      maxUsage: this._maxUsage,
      usageCount: this._usageCount,
      maxUsagePerUser: this._maxUsagePerUser,
      status: this._status,
      startsAt: this._startsAt,
      expiresAt: this._expiresAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
    };
  }
}

import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { CompPolicyViolationException } from '../comp.exception';

export class CompAccount {
  private constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly currency: ExchangeCurrencyCode,
    public readonly totalEarned: Prisma.Decimal,
    public readonly totalUsed: Prisma.Decimal,
    public readonly isFrozen: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  static create(params: {
    id?: bigint;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    totalEarned?: Prisma.Decimal;
    totalUsed?: Prisma.Decimal;
    isFrozen?: boolean;
  }): CompAccount {
    return new CompAccount(
      params.id ?? 0n,
      params.userId,
      params.currency,
      params.totalEarned ?? new Prisma.Decimal(0),
      params.totalUsed ?? new Prisma.Decimal(0),
      params.isFrozen ?? false,
      new Date(),
      new Date(),
    );
  }

  /**
   * Rehydrate a CompAccount from persistence layer.
   * Used by repository/mapper only.
   */
  static rehydrate(params: {
    id: bigint;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    totalEarned: Prisma.Decimal;
    totalUsed: Prisma.Decimal;
    isFrozen: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CompAccount {
    return new CompAccount(
      params.id,
      params.userId,
      params.currency,
      params.totalEarned,
      params.totalUsed,
      params.isFrozen,
      params.createdAt,
      params.updatedAt,
    );
  }

  updateStatus(isFrozen: boolean): CompAccount {
    return new CompAccount(
      this.id,
      this.userId,
      this.currency,
      this.totalEarned,
      this.totalUsed,
      isFrozen,
      this.createdAt,
      new Date(),
    );
  }

  private checkStatus() {
    if (this.isFrozen) {
      throw new CompPolicyViolationException('Comp account is frozen.');
    }
  }

  /**
   * Adds to the total earned amount.
   */
  earn(amount: Prisma.Decimal): CompAccount {
    this.checkStatus();
    return new CompAccount(
      this.id,
      this.userId,
      this.currency,
      this.totalEarned.add(amount),
      this.totalUsed,
      this.isFrozen,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Adds to the total used amount (e.g., when settlement is successfully executed).
   */
  settle(amount: Prisma.Decimal): CompAccount {
    this.checkStatus();
    return new CompAccount(
      this.id,
      this.userId,
      this.currency,
      this.totalEarned,
      this.totalUsed.add(amount),
      this.isFrozen,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Reverts previously earned amount (e.g., when a game round is voided).
   */
  rollbackEarn(amount: Prisma.Decimal): CompAccount {
    this.checkStatus();
    return new CompAccount(
      this.id,
      this.userId,
      this.currency,
      this.totalEarned.sub(amount),
      this.totalUsed,
      this.isFrozen,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Admin adjustments. 
   * Bypass checkStatus to allow admin to fix things.
   */
  adminAdjust(amount: Prisma.Decimal): CompAccount {
    return new CompAccount(
      this.id,
      this.userId,
      this.currency,
      this.totalEarned.add(amount),
      this.totalUsed,
      this.isFrozen,
      this.createdAt,
      new Date(),
    );
  }
}

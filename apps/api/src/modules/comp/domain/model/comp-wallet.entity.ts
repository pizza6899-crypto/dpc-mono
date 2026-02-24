import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  InsufficientCompBalanceException,
  CompPolicyViolationException,
} from '../comp.exception';

export class CompWallet {
  private constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly currency: ExchangeCurrencyCode,
    public readonly balance: Prisma.Decimal,
    public readonly totalEarned: Prisma.Decimal,
    public readonly totalUsed: Prisma.Decimal,
    public readonly isFrozen: boolean,
    public readonly lastClaimedAt: Date | null,
    public readonly lastActiveAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) { }

  static create(params: {
    id?: bigint;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    balance?: Prisma.Decimal;
    totalEarned?: Prisma.Decimal;
    totalUsed?: Prisma.Decimal;
  }): CompWallet {
    return new CompWallet(
      params.id ?? 0n,
      params.userId,
      params.currency,
      params.balance ?? new Prisma.Decimal(0),
      params.totalEarned ?? new Prisma.Decimal(0),
      params.totalUsed ?? new Prisma.Decimal(0),
      false,
      null,
      new Date(),
      new Date(),
      new Date(),
    );
  }

  /**
   * Rehydrate a CompWallet from persistence layer.
   * Used by repository/mapper only.
   */
  static rehydrate(params: {
    id: bigint;
    userId: bigint;
    currency: ExchangeCurrencyCode;
    balance: Prisma.Decimal;
    totalEarned: Prisma.Decimal;
    totalUsed: Prisma.Decimal;
    isFrozen: boolean;
    lastClaimedAt: Date | null;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): CompWallet {
    return new CompWallet(
      params.id,
      params.userId,
      params.currency,
      params.balance,
      params.totalEarned,
      params.totalUsed,
      params.isFrozen,
      params.lastClaimedAt,
      params.lastActiveAt,
      params.createdAt,
      params.updatedAt,
    );
  }

  private checkStatus() {
    if (this.isFrozen) {
      throw new CompPolicyViolationException('Comp wallet is frozen.');
    }
  }

  earn(amount: Prisma.Decimal): CompWallet {
    this.checkStatus();
    return new CompWallet(
      this.id,
      this.userId,
      this.currency,
      this.balance.add(amount),
      this.totalEarned.add(amount),
      this.totalUsed,
      this.isFrozen,
      this.lastClaimedAt,
      new Date(), // Update lastActiveAt
      this.createdAt,
      new Date(),
    );
  }

  claim(amount: Prisma.Decimal): CompWallet {
    this.checkStatus();
    if (this.balance.lessThan(amount)) {
      throw new InsufficientCompBalanceException(
        amount.toString(),
        this.balance.toString(),
      );
    }

    return new CompWallet(
      this.id,
      this.userId,
      this.currency,
      this.balance.sub(amount),
      this.totalEarned,
      this.totalUsed.add(amount),
      this.isFrozen,
      new Date(), // Update lastClaimedAt
      new Date(), // Update lastActiveAt
      this.createdAt,
      new Date(),
    );
  }

  deduct(
    amount: Prisma.Decimal,
    options?: { allowNegative?: boolean },
  ): CompWallet {
    this.checkStatus();
    const allowNegative = options?.allowNegative ?? false;
    if (!allowNegative && this.balance.lessThan(amount)) {
      throw new InsufficientCompBalanceException(
        amount.toString(),
        this.balance.toString(),
      );
    }

    return new CompWallet(
      this.id,
      this.userId,
      this.currency,
      this.balance.sub(amount),
      this.totalEarned,
      this.totalUsed.add(amount), // Also count as used/deducted
      this.isFrozen,
      this.lastClaimedAt,
      new Date(), // Update lastActiveAt
      this.createdAt,
      new Date(),
    );
  }
}

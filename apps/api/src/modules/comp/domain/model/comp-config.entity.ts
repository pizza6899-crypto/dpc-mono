import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class CompConfig {
  private constructor(
    public readonly id: bigint,
    public readonly currency: ExchangeCurrencyCode,
    public readonly isEarnEnabled: boolean,
    public readonly isSettlementEnabled: boolean,
    public readonly maxDailyEarnPerUser: Prisma.Decimal,
    public readonly minSettlementAmount: Prisma.Decimal,
    public readonly description: string | null,
    public readonly updatedAt: Date,
  ) { }

  static create(params: {
    currency: ExchangeCurrencyCode;
    isEarnEnabled?: boolean;
    isSettlementEnabled?: boolean;
    maxDailyEarnPerUser?: Prisma.Decimal;
    minSettlementAmount?: Prisma.Decimal;
    description?: string;
  }): CompConfig {
    return new CompConfig(
      BigInt(0), // ID is assigned by DB
      params.currency,
      params.isEarnEnabled ?? true,
      params.isSettlementEnabled ?? true,
      params.maxDailyEarnPerUser ?? new Prisma.Decimal(0),
      params.minSettlementAmount ?? new Prisma.Decimal(0),
      params.description ?? null,
      new Date(),
    );
  }

  static rehydrate(params: {
    id: bigint;
    currency: ExchangeCurrencyCode;
    isEarnEnabled: boolean;
    isSettlementEnabled: boolean;
    maxDailyEarnPerUser: Prisma.Decimal;
    minSettlementAmount: Prisma.Decimal;
    description: string | null;
    updatedAt: Date;
  }): CompConfig {
    return new CompConfig(
      params.id,
      params.currency,
      params.isEarnEnabled,
      params.isSettlementEnabled,
      params.maxDailyEarnPerUser,
      params.minSettlementAmount,
      params.description,
      params.updatedAt,
    );
  }

  canEarn(): boolean {
    return this.isEarnEnabled;
  }

  canSettle(amount: Prisma.Decimal): boolean {
    if (!this.isSettlementEnabled) return false;
    if (amount.lessThan(this.minSettlementAmount)) return false;
    return true;
  }
}

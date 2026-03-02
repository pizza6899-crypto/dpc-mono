import type {
  Prisma,
  TierChangeType,
  TierHistoryReferenceType,
  ExchangeCurrencyCode,
  TierHistory as PrismaTierHistory,
} from '@prisma/client';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

export class TierHistory {
  constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly fromTierId: bigint | null,
    public readonly toTierId: bigint,
    public readonly changeType: TierChangeType,
    public readonly reason: string | null,

    // Snapshot: Performance & Status
    public readonly statusRollingUsdSnap: Prisma.Decimal,
    public readonly statusExpSnap: bigint,
    public readonly compRateSnap: Prisma.Decimal,
    public readonly weeklyLossbackRateSnap: Prisma.Decimal,
    public readonly monthlyLossbackRateSnap: Prisma.Decimal,
    public readonly lifetimeRollingUsdSnap: Prisma.Decimal,
    public readonly lifetimeDepositUsdSnap: Prisma.Decimal,

    // Snapshot: Limits
    public readonly dailyWithdrawalLimitUsdSnap: Prisma.Decimal,
    public readonly weeklyWithdrawalLimitUsdSnap: Prisma.Decimal,
    public readonly monthlyWithdrawalLimitUsdSnap: Prisma.Decimal,

    // Reward Audit
    public readonly hasBonusGenerated: boolean,
    public readonly currency: ExchangeCurrencyCode,
    public readonly upgradeBonusSnap: Prisma.Decimal,
    public readonly skippedReason: string | null,

    public readonly changedAt: Date,
    public readonly changedBy: bigint | null,

    // Audit Reference
    public readonly referenceType: TierHistoryReferenceType | null,
    public readonly referenceId: bigint | null,
  ) {}

  static fromPersistence(data: PrismaTierHistory): TierHistory {
    return new TierHistory(
      Cast.bigint(data.id),
      Cast.bigint(data.userId),
      Cast.bigint(data.fromTierId),
      Cast.bigint(data.toTierId),
      data.changeType,
      data.reason,
      Cast.decimal(data.statusRollingUsdSnap),
      Cast.bigint(data.statusExpSnap),
      Cast.decimal(data.compRateSnap),
      Cast.decimal(data.weeklyLossbackRateSnap),
      Cast.decimal(data.monthlyLossbackRateSnap),
      Cast.decimal(data.lifetimeRollingUsdSnap),
      Cast.decimal(data.lifetimeDepositUsdSnap),
      Cast.decimal(data.dailyWithdrawalLimitUsdSnap),
      Cast.decimal(data.weeklyWithdrawalLimitUsdSnap),
      Cast.decimal(data.monthlyWithdrawalLimitUsdSnap),
      data.hasBonusGenerated,
      data.currency,
      Cast.decimal(data.upgradeBonusSnap),
      data.skippedReason,
      Cast.date(data.changedAt),
      Cast.bigint(data.changedBy),
      data.referenceType,
      Cast.bigint(data.referenceId),
    );
  }
}

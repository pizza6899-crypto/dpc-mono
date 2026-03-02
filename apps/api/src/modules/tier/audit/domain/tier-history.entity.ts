import type {
  Prisma,
  TierChangeType,
  TierHistoryReferenceType,
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

    // Snapshot: Data at the time of change
    public readonly statusRollingUsdSnap: Prisma.Decimal,
    public readonly currentPeriodDepositUsdSnap: Prisma.Decimal,
    public readonly compRateSnap: Prisma.Decimal,
    public readonly weeklyLossbackRateSnap: Prisma.Decimal,
    public readonly monthlyLossbackRateSnap: Prisma.Decimal,

    // Snapshot: Rules & Status
    public readonly upgradeRollingRequiredUsdSnap: Prisma.Decimal,
    public readonly upgradeDepositRequiredUsdSnap: Prisma.Decimal,
    public readonly lifetimeRollingUsdSnap: Prisma.Decimal,
    public readonly lifetimeDepositUsdSnap: Prisma.Decimal,

    // Bonus Info
    public readonly hasBonusGenerated: boolean,
    public readonly bonusAmountUsdSnap: Prisma.Decimal,
    public readonly skippedReason: string | null,

    public readonly changedAt: Date,
    public readonly changeBy: string | null,

    // Audit Reference
    public readonly referenceType: TierHistoryReferenceType | null,
    public readonly referenceId: bigint | null,
  ) { }

  static fromPersistence(data: PrismaTierHistory): TierHistory {
    return new TierHistory(
      Cast.bigint(data.id),
      Cast.bigint(data.userId),
      Cast.bigint(data.fromTierId),
      Cast.bigint(data.toTierId),
      data.changeType,
      data.reason,
      Cast.decimal(data.statusRollingUsdSnap),
      Cast.decimal(data.currentPeriodDepositUsdSnap),
      Cast.decimal(data.compRateSnap),
      Cast.decimal(data.weeklyLossbackRateSnap),
      Cast.decimal(data.monthlyLossbackRateSnap),
      Cast.decimal(data.upgradeRollingRequiredUsdSnap),
      Cast.decimal(data.upgradeDepositRequiredUsdSnap),
      Cast.decimal(data.lifetimeRollingUsdSnap),
      Cast.decimal(data.lifetimeDepositUsdSnap),
      data.hasBonusGenerated,
      Cast.decimal(data.bonusAmountUsdSnap),
      data.skippedReason,
      Cast.date(data.changedAt),
      data.changeBy,
      data.referenceType,
      Cast.bigint(data.referenceId),
    );
  }
}

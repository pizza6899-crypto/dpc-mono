import type { Prisma, TierStats as PrismaTierStats } from '@prisma/client';

export class TierStats {
  constructor(
    public readonly timestamp: Date,
    public readonly tierId: bigint,
    public readonly snapshotUserCount: number,

    // Performance Metrics (USD)
    public readonly periodRollingUsd: Prisma.Decimal,
    public readonly periodPayoutUsd: Prisma.Decimal,
    public readonly periodNetRevenueUsd: Prisma.Decimal,
    public readonly periodUpgradeBonusPaidUsd: Prisma.Decimal,
    public readonly periodCompPaidUsd: Prisma.Decimal,
    public readonly periodLossbackPaidUsd: Prisma.Decimal,
    public readonly periodDepositUsd: Prisma.Decimal,
    public readonly periodWithdrawalUsd: Prisma.Decimal,

    // Active Metrics
    public readonly periodActiveUserCount: number,

    // Changes
    public readonly upgradedCount: number,
    public readonly downgradedCount: number,
    public readonly maintainedCount: number,
    public readonly graceCount: number,

    public readonly updatedAt: Date,
  ) {}

  static fromPersistence(data: PrismaTierStats): TierStats {
    return new TierStats(
      data.timestamp,
      data.tierId,
      data.snapshotUserCount,
      data.periodRollingUsd,
      data.periodPayoutUsd,
      data.periodNetRevenueUsd,
      data.periodUpgradeBonusPaidUsd,
      data.periodCompPaidUsd,
      data.periodLossbackPaidUsd,
      data.periodDepositUsd,
      data.periodWithdrawalUsd,
      data.periodActiveUserCount,
      data.upgradedCount,
      data.downgradedCount,
      data.maintainedCount,
      data.graceCount,
      data.updatedAt,
    );
  }
}

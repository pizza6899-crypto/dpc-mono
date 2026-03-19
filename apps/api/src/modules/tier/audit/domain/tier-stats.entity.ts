import type { Prisma, TierStats as PrismaTierStats } from '@prisma/client';
import { Cast } from 'src/infrastructure/persistence/persistence.util';

export class TierStats {
  constructor(
    public readonly timestamp: Date,
    public readonly tierId: bigint,
    public readonly snapshotUserCount: number,

    // Metrics
    public readonly periodActiveUserCount: number,
    public readonly periodExpGranted: bigint,

    // Changes
    public readonly upgradedCount: number,
    public readonly downgradedCount: number,
    public readonly maintainedCount: number,
    public readonly graceCount: number,

    // Activity Metrics (USD)
    public readonly periodTotalRollingUsd: Prisma.Decimal,
    public readonly periodRewardClaimedUsd: Prisma.Decimal,

    public readonly updatedAt: Date,
  ) {}

  static fromPersistence(data: PrismaTierStats): TierStats {
    return new TierStats(
      data.timestamp,
      Cast.bigint(data.tierId),
      data.snapshotUserCount,
      data.periodActiveUserCount,
      Cast.bigint(data.periodExpGranted),
      data.upgradedCount,
      data.downgradedCount,
      data.maintainedCount,
      data.graceCount,
      Cast.decimal(data.periodTotalRollingUsd),
      Cast.decimal(data.periodRewardClaimedUsd),
      data.updatedAt,
    );
  }
}

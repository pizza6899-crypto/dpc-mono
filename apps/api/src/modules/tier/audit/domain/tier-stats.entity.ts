import { Prisma, TierStats as PrismaTierStats } from '@prisma/client';

export class TierStats {
    constructor(
        public readonly timestamp: Date,
        public readonly tierId: bigint,
        public readonly snapshotUserCount: number,

        // Metrics
        public readonly periodBonusPaidUsd: Prisma.Decimal,
        public readonly periodRollingUsd: Prisma.Decimal,
        public readonly periodDepositUsd: Prisma.Decimal,

        // Changes
        public readonly upgradedCount: number,
        public readonly downgradedCount: number,
        public readonly maintainedCount: number,
        public readonly graceCount: number,

        public readonly updatedAt: Date,
    ) { }

    static fromPersistence(data: PrismaTierStats): TierStats {
        return new TierStats(
            data.timestamp,
            data.tierId,
            data.snapshotUserCount,
            data.periodBonusPaidUsd,
            data.periodRollingUsd,
            data.periodDepositUsd,
            data.upgradedCount,
            data.downgradedCount,
            data.maintainedCount,
            data.graceCount,
            data.updatedAt,
        );
    }
}

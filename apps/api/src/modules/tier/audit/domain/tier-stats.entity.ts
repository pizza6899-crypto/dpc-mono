import { Prisma, TierStats as PrismaTierStats } from '@prisma/client';

export class TierStats {
    constructor(
        public readonly timestamp: Date,
        public readonly tierId: bigint,
        public readonly snapshotUserCount: number,
        public readonly totalBonusPaidUsd: Prisma.Decimal,
        public readonly totalRollingUsd: Prisma.Decimal,
        public readonly totalDepositUsd: Prisma.Decimal,
        public readonly promotedCount: number,
        public readonly demotedCount: number,
        public readonly updatedAt: Date,
    ) { }

    static fromPersistence(data: PrismaTierStats): TierStats {
        return new TierStats(
            data.timestamp,
            data.tierId,
            data.snapshotUserCount,
            data.totalBonusPaidUsd,
            data.totalRollingUsd,
            data.totalDepositUsd,
            data.promotedCount,
            data.demotedCount,
            data.updatedAt
        );
    }
}

import { Prisma } from '@prisma/client';

export class TierStats {
    constructor(
        public readonly timestamp: Date,
        public readonly tierId: bigint,
        public readonly snapshotUserCount: number,
        public readonly totalBonusPaidUsd: Prisma.Decimal,
        public readonly totalRollingUsd: Prisma.Decimal,
        public readonly promotedCount: number,
        public readonly demotedCount: number,
        public readonly updatedAt: Date,
    ) { }

    static fromPersistence(data: any): TierStats {
        return new TierStats(
            data.timestamp,
            data.tierId,
            data.snapshotUserCount,
            data.totalBonusPaidUsd,
            data.totalRollingUsd,
            data.promotedCount,
            data.demotedCount,
            data.updatedAt
        );
    }
}

export class UserTierPeriodStats {
    constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly year: number,
        public readonly month: number,
        public readonly tierId: bigint,
        public readonly monthlyRollingUsd: Prisma.Decimal,
        public readonly monthlyDepositUsd: Prisma.Decimal,
        public readonly createdAt: Date,
    ) { }

    static fromPersistence(data: any): UserTierPeriodStats {
        return new UserTierPeriodStats(
            data.id,
            data.userId,
            data.year,
            data.month,
            data.tierId,
            data.monthlyRollingUsd,
            data.monthlyDepositUsd,
            data.createdAt
        );
    }
}

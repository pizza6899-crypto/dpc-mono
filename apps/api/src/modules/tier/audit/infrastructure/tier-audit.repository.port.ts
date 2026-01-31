import type { TierHistory } from '../domain/tier-history.entity';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import type {
    Prisma,
    TierChangeType,
    TierHistoryReferenceType,
} from '@prisma/client';

export interface CreateTierHistoryProps {
    userId: bigint;
    fromTierId: bigint | null;
    toTierId: bigint;
    changeType: TierChangeType;
    reason?: string | null;
    rollingAmountSnap: Prisma.Decimal;
    depositAmountSnap: Prisma.Decimal;
    compRateSnap: Prisma.Decimal;
    lossbackRateSnap: Prisma.Decimal;
    rakebackRateSnap: Prisma.Decimal;
    requirementUsdSnap: Prisma.Decimal;
    requirementDepositUsdSnap: Prisma.Decimal;
    cumulativeDepositUsdSnap: Prisma.Decimal;
    bonusAmount?: Prisma.Decimal | null;
    skippedBonusAmount?: Prisma.Decimal | null;
    skippedReason?: string | null;
    changeBy?: string | null;
    referenceType?: TierHistoryReferenceType | null;
    referenceId?: bigint | null;
    id: bigint;
    changedAt: Date;
}

export interface UpdateTierStatsProps {
    snapshotUserCount?: number;
    totalBonusPaidUsd?: Prisma.Decimal;
    totalRollingUsd?: Prisma.Decimal;
    totalDepositUsd?: Prisma.Decimal;
    promotedCount?: number;
    demotedCount?: number;
}


export abstract class TierAuditRepositoryPort {
    // 1. History
    abstract saveHistory(props: CreateTierHistoryProps): Promise<TierHistory>;
    abstract findHistoryByUserId(
        userId: bigint,
        params?: {
            startDate?: Date;
            endDate?: Date;
            page?: number;
            limit?: number;
            changeType?: TierChangeType;
        },
    ): Promise<PaginatedData<TierHistory>>;


    // 4. Stats
    abstract updateStats(
        timestamp: Date,
        tierId: bigint,
        data: UpdateTierStatsProps,
    ): Promise<void>;
}

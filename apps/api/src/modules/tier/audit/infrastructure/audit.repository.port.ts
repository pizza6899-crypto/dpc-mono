import type { TierHistory } from '../domain/tier-history.entity';
import type { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';
import { PaginatedData } from 'src/common/http/types/pagination.types';
import type {
    Prisma,
    TierChangeType,
    TierHistoryReferenceType,
    EvaluationStatus,
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

export interface UpdateEvaluationLogMetrics {
    totalProcessedCount?: number;
    promotedCount?: number;
    demotedCount?: number;
    gracePeriodCount?: number;
    maintainedCount?: number;
    skippedBonusCount?: number;
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

    // 2. Evaluation Log
    abstract createEvaluationLog(
        id: bigint,
        timestamp: Date,
        status: EvaluationStatus,
    ): Promise<TierEvaluationLog>;
    abstract updateEvaluationLog(
        id: bigint,
        startedAt: Date,
        data: UpdateEvaluationLogMetrics & {
            status?: EvaluationStatus;
            finishedAt?: Date;
            errorMessage?: string | null;
        },
    ): Promise<TierEvaluationLog>;
    abstract findEvaluationLogs(
        page?: number,
        limit?: number,
    ): Promise<PaginatedData<TierEvaluationLog>>;

    // 4. Stats
    abstract updateStats(
        timestamp: Date,
        tierId: bigint,
        data: UpdateTierStatsProps,
    ): Promise<void>;
}

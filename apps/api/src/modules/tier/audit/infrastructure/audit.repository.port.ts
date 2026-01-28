import { TierHistory } from '../domain/tier-history.entity';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';
import { TierDemotionWarning } from '../domain/tier-demotion-warning.entity';
import { Prisma, TierChangeType, TierHistoryReferenceType, EvaluationStatus } from '@prisma/client';

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
    abstract findHistoryByUserId(userId: bigint, limit?: number): Promise<TierHistory[]>;

    // 2. Evaluation Log
    abstract createEvaluationLog(status: EvaluationStatus): Promise<TierEvaluationLog>;
    abstract updateEvaluationLog(id: bigint, startedAt: Date, data: UpdateEvaluationLogMetrics & { status?: EvaluationStatus, finishedAt?: Date, errorMessage?: string | null }): Promise<TierEvaluationLog>;

    // 3. Demotion Warning
    abstract upsertDemotionWarning(warning: TierDemotionWarning): Promise<TierDemotionWarning>;
    abstract deleteDemotionWarning(userId: bigint): Promise<void>;

    // 4. Stats
    abstract updateStats(timestamp: Date, tierId: bigint, data: UpdateTierStatsProps): Promise<void>;
}

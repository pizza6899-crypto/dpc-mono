import { TierHistory } from '../domain/tier-history.entity';
import { TierEvaluationLog } from '../domain/tier-evaluation-log.entity';
import { TierDemotionWarning } from '../domain/tier-demotion-warning.entity';
import { UserTierPeriodStats } from '../domain/tier-stats.entity';
import { Prisma, TierChangeType, TierHistoryReferenceType, EvaluationStatus } from '@prisma/client';

export interface CreateTierHistoryProps {
    userId: bigint;
    fromTierId: bigint | null;
    toTierId: bigint;
    changeType: TierChangeType;
    reason?: string | null;
    rollingAmountSnap: Prisma.Decimal;
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

export abstract class TierAuditRepositoryPort {
    // 1. History
    abstract saveHistory(props: CreateTierHistoryProps): Promise<TierHistory>;
    abstract findHistoryByUserId(userId: bigint, limit?: number): Promise<TierHistory[]>;

    // 2. Evaluation Log
    abstract createEvaluationLog(status: EvaluationStatus): Promise<TierEvaluationLog>;
    abstract updateEvaluationLog(id: bigint, data: Partial<TierEvaluationLog>): Promise<TierEvaluationLog>;

    // 3. Demotion Warning
    abstract upsertDemotionWarning(warning: TierDemotionWarning): Promise<TierDemotionWarning>;
    abstract deleteDemotionWarning(userId: bigint): Promise<void>;

    // 4. Stats
    abstract updateStats(timestamp: Date, tierId: bigint, data: any): Promise<void>;
    abstract savePeriodStats(stats: UserTierPeriodStats): Promise<void>;
}

export const TIER_AUDIT_QUEUE_NAME = 'tier-audit';

export enum TierAuditJobType {
    RECORD_STATS = 'RECORD_STATS',
    RECORD_PERIOD_STATS = 'RECORD_PERIOD_STATS',
    RECORD_DEMOTION_WARNING = 'RECORD_DEMOTION_WARNING',
}

export interface RecordStatsJobData {
    timestamp: string | Date;
    tierId: string;
    metrics: {
        snapshotUserCount?: number;
        totalBonusPaidUsd?: string;
        totalRollingUsd?: string;
        promotedCount?: number;
        demotedCount?: number;
    };
}

export interface RecordPeriodStatsJobData {
    userId: string;
    year: number;
    month: number;
    tierId: string;
    monthlyRollingUsd: string;
    monthlyDepositUsd: string;
    createdAt: string;
}

export interface RecordDemotionWarningJobData {
    userId: string;
    currentTierId: string;
    targetTierId: string;
    evaluationDueAt: string;
    requiredRolling: string;
    currentRolling: string;
    lastNotifiedAt: string | null;
}

export type TierAuditJobPayload =
    | { type: TierAuditJobType.RECORD_STATS; data: RecordStatsJobData }
    | { type: TierAuditJobType.RECORD_PERIOD_STATS; data: RecordPeriodStatsJobData }
    | { type: TierAuditJobType.RECORD_DEMOTION_WARNING; data: RecordDemotionWarningJobData };



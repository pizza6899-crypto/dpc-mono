export const TIER_AUDIT_QUEUE_NAME = 'tier-audit';

export enum TierAuditJobType {
    RECORD_TIER_SNAPSHOT = 'RECORD_TIER_SNAPSHOT',
    RECORD_DEMOTION_WARNING = 'RECORD_DEMOTION_WARNING',
}

export interface RecordTierSnapshotJobData {
    timestamp: string | Date;
    tierId: string;
    metrics: {
        snapshotUserCount?: number;
        totalBonusPaidUsd?: string;
        totalRollingUsd?: string;
        totalDepositUsd?: string;
        promotedCount?: number;
        demotedCount?: number;
    };
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
    | { type: TierAuditJobType.RECORD_TIER_SNAPSHOT; data: RecordTierSnapshotJobData }
    | { type: TierAuditJobType.RECORD_DEMOTION_WARNING; data: RecordDemotionWarningJobData };




export enum TierAuditJobType {
    RECORD_TIER_SNAPSHOT = 'RECORD_TIER_SNAPSHOT',
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

export type TierAuditJobPayload =
    | { type: TierAuditJobType.RECORD_TIER_SNAPSHOT; data: RecordTierSnapshotJobData };



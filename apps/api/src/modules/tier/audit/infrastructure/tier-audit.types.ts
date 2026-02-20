export enum TierAuditJobType {
  RECORD_TIER_SNAPSHOT = 'RECORD_TIER_SNAPSHOT',
  INCREMENT_TIER_STATS = 'INCREMENT_TIER_STATS',
}

export interface RecordTierSnapshotJobData {
  timestamp: string | Date;
  tierId: string;
  metrics: {
    snapshotUserCount?: number;
    periodBonusPaidUsd?: string;
    periodRollingUsd?: string;
    periodDepositUsd?: string;
    upgradedCount?: number;
    downgradedCount?: number;
    maintainedCount?: number;
    graceCount?: number;
  };
}

export type TierAuditJobPayload =
  | {
      type: TierAuditJobType.RECORD_TIER_SNAPSHOT;
      data: RecordTierSnapshotJobData;
    }
  | {
      type: TierAuditJobType.INCREMENT_TIER_STATS;
      data: RecordTierSnapshotJobData;
    };

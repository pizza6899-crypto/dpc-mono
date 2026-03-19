export enum TierAuditJobType {
  RECORD_TIER_SNAPSHOT = 'RECORD_TIER_SNAPSHOT',
  INCREMENT_TIER_STATS = 'INCREMENT_TIER_STATS',
}

export interface RecordTierSnapshotJobData {
  timestamp: string | Date;
  tierId: string;
  metrics: {
    snapshotUserCount?: number;
    periodActiveUserCount?: number;
    periodExpGranted?: string; // bigint (string serialized)
    upgradedCount?: number;
    downgradedCount?: number;
    maintainedCount?: number;
    graceCount?: number;
    periodTotalRollingUsd?: string;
    periodRewardClaimedUsd?: string;
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

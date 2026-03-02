import type {
  CreateTierHistoryProps,
  CreateUserExpLogProps,
} from './tier-audit.repository.port';

export enum TierAuditJobType {
  RECORD_TIER_SNAPSHOT = 'RECORD_TIER_SNAPSHOT',
  INCREMENT_TIER_STATS = 'INCREMENT_TIER_STATS',
  RECORD_TIER_HISTORY = 'RECORD_TIER_HISTORY',
  RECORD_USER_EXP_LOG = 'RECORD_USER_EXP_LOG',
}

export interface RecordTierSnapshotJobData {
  timestamp: string | Date;
  tierId: string;
  metrics: {
    snapshotUserCount?: number;
    periodRollingUsd?: string;
    periodPayoutUsd?: string;
    periodNetRevenueUsd?: string;
    periodUpgradeBonusPaidUsd?: string;
    periodCompPaidUsd?: string;
    periodLossbackPaidUsd?: string;
    periodDepositUsd?: string;
    periodWithdrawalUsd?: string;
    periodActiveUserCount?: number;
    upgradedCount?: number;
    downgradedCount?: number;
    maintainedCount?: number;
    graceCount?: number;
  };
}

export interface RecordTierHistoryJobData extends Omit<
  CreateTierHistoryProps,
  | 'statusRollingUsdSnap'
  | 'compRateSnap'
  | 'weeklyLossbackRateSnap'
  | 'monthlyLossbackRateSnap'
  | 'lifetimeRollingUsdSnap'
  | 'lifetimeDepositUsdSnap'
  | 'dailyWithdrawalLimitUsdSnap'
  | 'weeklyWithdrawalLimitUsdSnap'
  | 'monthlyWithdrawalLimitUsdSnap'
  | 'upgradeBonusSnap'
> {
  statusRollingUsdSnap: string;
  compRateSnap: string;
  weeklyLossbackRateSnap: string;
  monthlyLossbackRateSnap: string;
  lifetimeRollingUsdSnap: string;
  lifetimeDepositUsdSnap: string;
  dailyWithdrawalLimitUsdSnap: string;
  weeklyWithdrawalLimitUsdSnap: string;
  monthlyWithdrawalLimitUsdSnap: string;
  upgradeBonusSnap: string;
}

export interface RecordUserExpLogJobData extends Omit<
  CreateUserExpLogProps,
  'amount' | 'statusExpSnap'
> {
  amount: string;
  statusExpSnap: string;
}

export type TierAuditJobPayload =
  | {
      type: TierAuditJobType.RECORD_TIER_SNAPSHOT;
      data: RecordTierSnapshotJobData;
    }
  | {
      type: TierAuditJobType.INCREMENT_TIER_STATS;
      data: RecordTierSnapshotJobData;
    }
  | {
      type: TierAuditJobType.RECORD_TIER_HISTORY;
      data: RecordTierHistoryJobData;
    }
  | {
      type: TierAuditJobType.RECORD_USER_EXP_LOG;
      data: RecordUserExpLogJobData;
    };

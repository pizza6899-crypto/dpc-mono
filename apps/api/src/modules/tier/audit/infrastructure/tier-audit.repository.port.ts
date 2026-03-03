import type { TierHistory } from '../domain/tier-history.entity';
import type { PaginatedData } from 'src/common/http/types/pagination.types';
import type {
  Prisma,
  TierChangeType,
  TierHistoryReferenceType,
  ExchangeCurrencyCode,
  ExpSourceType,
} from '@prisma/client';

export interface CreateTierHistoryProps {
  id: bigint;
  userId: bigint;
  fromTierId: bigint | null;
  toTierId: bigint;
  changeType: TierChangeType;
  reason?: string | null;

  // Benefit Snapshot
  compRateSnap: Prisma.Decimal;
  weeklyLossbackRateSnap: Prisma.Decimal;
  monthlyLossbackRateSnap: Prisma.Decimal;
  upgradeBonusWageringMultiplierSnap: Prisma.Decimal;

  // Limit & Flag Snapshot
  dailyWithdrawalLimitUsdSnap: Prisma.Decimal;
  weeklyWithdrawalLimitUsdSnap: Prisma.Decimal;
  monthlyWithdrawalLimitUsdSnap: Prisma.Decimal;
  isWithdrawalUnlimitedSnap: boolean;
  hasDedicatedManagerSnap: boolean;

  // Custom Override Status
  isCustomBenefitAppliedSnap: boolean;

  // Reward Audit
  hasBonusGenerated: boolean;
  currency: ExchangeCurrencyCode;
  upgradeBonusSnap: Prisma.Decimal;
  skippedReason?: string | null;

  // XP Snapshot
  statusExpSnap: bigint;

  changedAt: Date;
  changedBy?: bigint | null;

  // Audit Reference
  referenceType?: TierHistoryReferenceType | null;
  referenceId?: bigint | null;
}

export interface UpdateTierStatsProps {
  snapshotUserCount?: number;
  periodActiveUserCount?: number;
  periodExpGranted?: bigint;
  upgradedCount?: number;
  downgradedCount?: number;
  maintainedCount?: number;
  graceCount?: number;
  periodTotalRollingUsd?: Prisma.Decimal;
  periodRewardClaimedUsd?: Prisma.Decimal;
}

export interface CreateUserExpLogProps {
  id: bigint;
  userId: bigint;
  amount: bigint;
  statusExpSnap: bigint;
  sourceType: ExpSourceType;
  referenceId?: bigint | null;
  reason?: string | null;
  createdAt: Date;
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

  abstract incrementStats(
    timestamp: Date,
    tierId: bigint,
    data: Partial<
      Record<keyof UpdateTierStatsProps, number | bigint | Prisma.Decimal>
    >,
  ): Promise<void>;

  // 5. XP Log
  abstract saveExpLog(props: CreateUserExpLogProps): Promise<void>;
}

import type { TierHistory } from '../domain/tier-history.entity';
import type { UserExpLog } from '../domain/user-exp-log.entity';
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

  // Snapshot data
  statusRollingUsdSnap: Prisma.Decimal;
  compRateSnap: Prisma.Decimal;
  weeklyLossbackRateSnap: Prisma.Decimal;
  monthlyLossbackRateSnap: Prisma.Decimal;
  lifetimeRollingUsdSnap: Prisma.Decimal;
  lifetimeDepositUsdSnap: Prisma.Decimal;

  // Snapshot: Limits (USD)
  dailyWithdrawalLimitUsdSnap: Prisma.Decimal;
  weeklyWithdrawalLimitUsdSnap: Prisma.Decimal;
  monthlyWithdrawalLimitUsdSnap: Prisma.Decimal;

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

export interface UpdateTierStatsProps {
  snapshotUserCount?: number;
  periodRollingUsd?: Prisma.Decimal;
  periodPayoutUsd?: Prisma.Decimal;
  periodNetRevenueUsd?: Prisma.Decimal;
  periodUpgradeBonusPaidUsd?: Prisma.Decimal;
  periodCompPaidUsd?: Prisma.Decimal;
  periodLossbackPaidUsd?: Prisma.Decimal;
  periodDepositUsd?: Prisma.Decimal;
  periodWithdrawalUsd?: Prisma.Decimal;
  periodActiveUserCount?: number;
  upgradedCount?: number;
  downgradedCount?: number;
  maintainedCount?: number;
  graceCount?: number;
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

  // 2. XP Log
  abstract saveExpLog(props: CreateUserExpLogProps): Promise<UserExpLog>;
  abstract findExpLogsByUserId(
    userId: bigint,
    params?: {
      startDate?: Date;
      endDate?: Date;
      page?: number;
      limit?: number;
      sourceType?: ExpSourceType;
    },
  ): Promise<PaginatedData<UserExpLog>>;

  // 4. Stats
  abstract updateStats(
    timestamp: Date,
    tierId: bigint,
    data: UpdateTierStatsProps,
  ): Promise<void>;

  abstract incrementStats(
    timestamp: Date,
    tierId: bigint,
    data: Partial<Record<keyof UpdateTierStatsProps, number | Prisma.Decimal>>,
  ): Promise<void>;
}

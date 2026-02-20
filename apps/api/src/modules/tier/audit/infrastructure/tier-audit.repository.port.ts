import type { TierHistory } from '../domain/tier-history.entity';
import type { PaginatedData } from 'src/common/http/types/pagination.types';
import type {
  Prisma,
  TierChangeType,
  TierHistoryReferenceType,
} from '@prisma/client';

export interface CreateTierHistoryProps {
  id: bigint;
  userId: bigint;
  fromTierId: bigint | null;
  toTierId: bigint;
  changeType: TierChangeType;
  reason?: string | null;

  // Snapshot: Data
  statusRollingUsdSnap: Prisma.Decimal;
  currentPeriodDepositUsdSnap: Prisma.Decimal;
  compRateSnap: Prisma.Decimal;
  weeklyLossbackRateSnap: Prisma.Decimal;
  monthlyLossbackRateSnap: Prisma.Decimal;

  // Snapshot: Rules & Status
  upgradeRollingRequiredUsdSnap: Prisma.Decimal;
  upgradeDepositRequiredUsdSnap: Prisma.Decimal;
  lifetimeRollingUsdSnap: Prisma.Decimal;
  lifetimeDepositUsdSnap: Prisma.Decimal;

  // Bonus Info
  hasBonusGenerated: boolean;
  bonusAmountUsdSnap: Prisma.Decimal;
  skippedReason?: string | null;

  changedAt: Date;
  changeBy?: string | null;

  // Audit Reference
  referenceType?: TierHistoryReferenceType | null;
  referenceId?: bigint | null;
}

export interface UpdateTierStatsProps {
  snapshotUserCount?: number;
  periodBonusPaidUsd?: Prisma.Decimal;
  periodRollingUsd?: Prisma.Decimal;
  periodDepositUsd?: Prisma.Decimal;
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

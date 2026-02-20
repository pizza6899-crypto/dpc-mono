import type { TierReward } from '../domain/tier-reward.entity';
import type { Prisma } from '@prisma/client';

export interface CreateTierRewardProps {
  userId: bigint;
  tierId: bigint;
  fromLevel: number;
  toLevel: number;
  bonusAmountUsd: number | Prisma.Decimal;
  wageringMultiplier: number | Prisma.Decimal;
  referenceId?: bigint | null;
  tierHistoryId?: bigint | null;
  expiresAt?: Date | null;
}

export interface FindRewardsQuery {
  userId?: bigint;
  status?: string[];
  fromDate?: Date;
  toDate?: Date;
  page: number;
  limit: number;
}

export interface PaginatedRewards {
  items: TierReward[];
  total: number;
}

export abstract class TierRewardRepositoryPort {
  abstract create(props: CreateTierRewardProps): Promise<TierReward>;
  abstract findById(id: bigint): Promise<TierReward | null>;
  abstract findPendingByUserId(userId: bigint): Promise<TierReward[]>;
  abstract findAll(query: FindRewardsQuery): Promise<PaginatedRewards>;
  abstract save(reward: TierReward): Promise<TierReward>;
}

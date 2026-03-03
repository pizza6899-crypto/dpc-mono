import type { UserTierStatus } from '@prisma/client';
import type { UserTier } from '../domain/user-tier.entity';

export abstract class UserTierRepositoryPort {
  abstract findByUserId(userId: bigint): Promise<UserTier | null>;
  abstract save(userTier: UserTier): Promise<UserTier>;
  abstract countGroupByTierId(): Promise<{ tierId: bigint; count: number }[]>;
  abstract countGroupByTierAndStatus(): Promise<
    { tierId: bigint; status: UserTierStatus; count: number }[]
  >;
  abstract incrementExp(userId: bigint, amount: bigint): Promise<UserTier>;
  abstract findIdsNeedingEvaluation(
    now: Date,
    limit: number,
    cursor?: bigint,
  ): Promise<bigint[]>;
  abstract findMany(params: {
    tierId?: bigint;
    status?: UserTierStatus;
    userId?: bigint;
    email?: string;
    search?: string;
    page: number;
    limit: number;
  }): Promise<{ items: UserTier[]; total: number }>;
}

import { UserTierStatus } from '@prisma/client';
import { UserTier } from '../domain/user-tier.entity';

export abstract class UserTierRepositoryPort {
    abstract findByUserId(userId: bigint): Promise<UserTier | null>;
    abstract save(userTier: UserTier): Promise<UserTier>;
    abstract countGroupByTierId(): Promise<{ tierId: bigint; count: number }[]>;
    abstract incrementRolling(userId: bigint, amountUsd: number): Promise<UserTier>;
    abstract incrementDeposit(userId: bigint, amountUsd: number): Promise<UserTier>;
    abstract findUsersNeedingEvaluation(now: Date, limit?: number): Promise<UserTier[]>;
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

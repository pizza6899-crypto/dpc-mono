import { UserTier } from '../domain/user-tier.entity';

export abstract class UserTierRepositoryPort {
    abstract findByUserId(userId: bigint): Promise<UserTier | null>;
    abstract save(userTier: UserTier): Promise<UserTier>;
    abstract countGroupByTierId(): Promise<{ tierId: bigint; count: number }[]>;
    abstract incrementRolling(userId: bigint, amountUsd: number): Promise<void>;
    abstract incrementDeposit(userId: bigint, amountUsd: number): Promise<void>;
    abstract findUsersNeedingEvaluation(now: Date): Promise<UserTier[]>;
}

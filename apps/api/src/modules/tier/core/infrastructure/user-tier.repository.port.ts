import { UserTier } from '../../domain/user-tier.entity';

export const USER_TIER_REPOSITORY = Symbol('USER_TIER_REPOSITORY');

export interface UserTierRepositoryPort {
    findByUserId(userId: bigint): Promise<UserTier | null>;
    save(userTier: UserTier): Promise<UserTier>;
}

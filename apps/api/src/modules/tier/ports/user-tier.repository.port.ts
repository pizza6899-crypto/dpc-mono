import { UserTier } from "../domain";

export interface UserTierRepositoryPort {
    findByUserId(userId: bigint): Promise<UserTier | null>;
    findByUid(uid: string): Promise<UserTier | null>;

    create(userTier: UserTier): Promise<UserTier>;
    update(userTier: UserTier): Promise<UserTier>;
}

import { TierReward } from '../domain/tier-reward.entity';
import { Prisma, TierUpgradeRewardStatus } from '@prisma/client';

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

export abstract class TierRewardRepositoryPort {
    abstract create(props: CreateTierRewardProps): Promise<TierReward>;
    abstract findById(id: bigint): Promise<TierReward | null>;
    abstract findPendingByUserId(userId: bigint): Promise<TierReward[]>;
    abstract save(reward: TierReward): Promise<TierReward>;
}

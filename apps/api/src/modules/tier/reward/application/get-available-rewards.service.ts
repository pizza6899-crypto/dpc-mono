import { Injectable } from '@nestjs/common';
import { TierRewardRepositoryPort } from '../infrastructure/tier-reward.repository.port';
import { TierReward } from '../domain/tier-reward.entity';
import { Language } from '@prisma/client';

export interface AvailableRewardResult {
    id: string; // sqid
    tierName: string;
    amount: string;
    wageringMultiplier: string;
    expiresAt: Date | null;
    createdAt: Date;
}

@Injectable()
export class GetAvailableRewardsService {
    constructor(
        private readonly rewardRepository: TierRewardRepositoryPort,
    ) { }

    async execute(userId: bigint, language: Language = Language.EN): Promise<TierReward[]> {
        return this.rewardRepository.findPendingByUserId(userId);
    }
}

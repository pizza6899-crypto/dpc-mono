import { Inject, Injectable } from '@nestjs/common';
import { USER_TIER_REPOSITORY, TIER_REPOSITORY } from '../ports/repository.token';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierRepositoryPort } from '../ports/tier.repository.port';

export interface TierUserCountResult {
    tierCode: string;
    tierId: string;
    count: number;
}

@Injectable()
export class CountUsersByTierService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(): Promise<TierUserCountResult[]> {
        const counts = await this.userTierRepository.getTierUserCounts();
        const tiers = await this.tierRepository.findAll();

        // Map tierId to Tier Entity
        const tierMap = new Map(tiers.map(t => [t.id?.toString(), t]));

        // We want to return all tiers, even if count is 0
        return tiers.map(tier => {
            if (!tier.id) return null!;
            const countEntry = counts.find(c => c.tierId === tier.id);
            return {
                tierCode: tier.code,
                tierId: tier.id.toString(),
                count: countEntry ? countEntry.count : 0,
            };
        }).filter(Boolean); // Filter out any nulls if tier.id missing
    }
}

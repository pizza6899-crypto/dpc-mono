import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
export interface TierDistributionResult {
    tierId: bigint;
    tierCode: string;
    tierName: string;
    tierLevel: number;
    count: number;
}

@Injectable()
export class GetTierDistributionService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(lang: Language = Language.EN): Promise<TierDistributionResult[]> {
        const counts = await this.userTierRepository.countGroupByTierId();
        const allTiers = await this.tierRepository.findAll();

        const countMap = new Map<bigint, number>();
        counts.forEach(c => countMap.set(c.tierId, c.count));

        return allTiers.map(tier => ({
            tierId: tier.id,
            tierCode: tier.code,
            tierName: tier.getName(lang),
            tierLevel: tier.level,
            count: countMap.get(tier.id) || 0,
        }));
    }
}

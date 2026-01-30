import { Injectable } from '@nestjs/common';
import { Language } from '@prisma/client';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
import { TierDistributionResponseDto } from '../controllers/admin/dto/tier-distribution.response.dto';

@Injectable()
export class GetTierDistributionService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(lang: Language = Language.EN): Promise<TierDistributionResponseDto[]> {
        const counts = await this.userTierRepository.countGroupByTierId();
        const allTiers = await this.tierRepository.findAll();

        const countMap = new Map<string, number>();
        counts.forEach(c => countMap.set(c.tierId.toString(), c.count));

        return allTiers.map(tier => ({
            tierId: tier.id.toString(),
            tierCode: tier.code,
            tierName: tier.getName(lang),
            count: countMap.get(tier.id.toString()) || 0
        }));
    }
}

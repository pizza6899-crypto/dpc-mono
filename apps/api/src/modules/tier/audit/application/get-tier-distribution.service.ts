import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { TierDistributionResponseDto } from '../controllers/admin/dto/tier-stats-admin.response.dto';

@Injectable()
export class GetTierDistributionService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(): Promise<TierDistributionResponseDto[]> {
        const counts = await this.userTierRepository.countGroupByTierId();
        const allTiers = await this.tierRepository.findAll();

        const countMap = new Map<string, number>();
        counts.forEach(c => countMap.set(c.tierId.toString(), c.count));

        return allTiers.map(tier => ({
            tierId: tier.id.toString(),
            tierName: tier.getName(),
            count: countMap.get(tier.id.toString()) || 0
        }));
    }
}

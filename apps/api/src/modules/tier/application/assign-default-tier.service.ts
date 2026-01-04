import { Inject, Injectable } from '@nestjs/common';
import { TIER_REPOSITORY, USER_TIER_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { UserTier } from '../domain/model/user-tier.entity';
import { TierException } from '../domain/tier.exception';

@Injectable()
export class AssignDefaultTierService {
    constructor(
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTier> {
        // 1. Check if user already has a tier
        const existing = await this.userTierRepository.findByUserId(userId);
        if (existing) {
            return existing; // Idempotency
        }

        // 2. Find lowest priority tier
        const defaultTier = await this.tierRepository.findLowestPriority();
        if (!defaultTier || !defaultTier.id) {
            throw new TierException('No default tier found to assign');
        }

        // 3. Create UserTier
        const userTier = UserTier.create({
            userId,
            tierId: defaultTier.id,
            tier: defaultTier,
        });

        return this.userTierRepository.create(userTier);
    }
}

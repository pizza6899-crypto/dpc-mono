import { Inject, Injectable } from '@nestjs/common';
import { TIER_REPOSITORY, USER_TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { UserTier } from '../domain/model/user-tier.entity';
import { TierHistory, TierChangeType } from '../domain/model/tier-history.entity';
import { TierException } from '../domain/tier.exception';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class AssignDefaultTierService {
    constructor(
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
        @Inject(TIER_HISTORY_REPOSITORY)
        private readonly tierHistoryRepository: TierHistoryRepositoryPort,
    ) { }

    @Transactional()
    async execute(userId: bigint): Promise<UserTier> {
        // Lock to prevent concurrent creation for the same user
        await this.userTierRepository.acquireLock(userId);

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

        const savedUserTier = await this.userTierRepository.create(userTier);

        // 4. Log History
        const history = TierHistory.create({
            userId,
            toTierId: defaultTier.id,
            changeType: TierChangeType.INITIAL,
            reason: 'Initial Assignment',
            rollingSnapshot: 0,
            bonusAmount: 0,
        });
        await this.tierHistoryRepository.create(history);

        return savedUserTier;
    }
}

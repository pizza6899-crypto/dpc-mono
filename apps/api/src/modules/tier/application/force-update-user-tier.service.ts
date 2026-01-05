import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { TIER_REPOSITORY, USER_TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { TierNotFoundException, UserTierNotFoundException } from '../domain/tier.exception';
import { TierHistory, TierChangeType } from '../domain/model/tier-history.entity';

@Injectable()
export class ForceUpdateUserTierService {
    constructor(
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
        @Inject(TIER_HISTORY_REPOSITORY)
        private readonly tierHistoryRepository: TierHistoryRepositoryPort,
    ) { }

    @Transactional()
    async execute(userId: bigint, tierCode: string, reason: string): Promise<void> {
        await this.userTierRepository.acquireLock(userId);

        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) {
            throw new UserTierNotFoundException(userId);
        }

        const targetTier = await this.tierRepository.findByCode(tierCode);
        if (!targetTier || !targetTier.id) {
            throw new TierNotFoundException(tierCode);
        }

        const fromTierId = userTier.tierId;

        // Force change. Explicitly set manual lock to true to prevent auto-downgrade immediately.
        userTier.forceChangeTier(targetTier, true);

        await this.userTierRepository.update(userTier);

        // Record History
        const history = TierHistory.create({
            userId,
            fromTierId,
            toTierId: targetTier.id,
            changeType: TierChangeType.MANUAL_ADJUSTMENT,
            reason: reason || 'Admin Manual Adjustment',
            rollingSnapshot: userTier.totalRollingUsd,
            bonusAmount: 0
        });

        await this.tierHistoryRepository.create(history);
    }
}

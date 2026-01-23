import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { USER_TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { UserTierNotFoundException } from '../domain/tier.exception';
import { TierChangeType, TierHistory } from '../domain/model/tier-history.entity';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

@Injectable()
export class UnlockUserTierService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
        @Inject(TIER_HISTORY_REPOSITORY)
        private readonly tierHistoryRepository: TierHistoryRepositoryPort,
        private readonly advisoryLockService: AdvisoryLockService,
    ) { }

    @Transactional()
    async execute(userId: bigint, reason?: string): Promise<void> {
        await this.advisoryLockService.acquireLock(LockNamespace.USER_TIER, userId.toString(), {
            throwThrottleError: true
        });

        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) {
            throw new UserTierNotFoundException(userId);
        }

        if (!userTier.isManualLock) {
            return; // Already unlocked
        }

        userTier.unlock();
        await this.userTierRepository.update(userTier);

        // Record History
        const history = TierHistory.create({
            userId,
            fromTierId: userTier.tierId,
            toTierId: userTier.tierId,
            changeType: TierChangeType.MANUAL_UPDATE,
            reason: reason || 'Admin unlocked tier',
            rollingSnapshot: userTier.totalRollingUsd,
            bonusAmount: 0
        });

        await this.tierHistoryRepository.create(history);
    }
}

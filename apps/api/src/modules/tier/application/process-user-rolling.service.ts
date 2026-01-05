import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { Prisma } from '@repo/database';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { USER_TIER_REPOSITORY, TIER_REPOSITORY, TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import { UserTierNotFoundException } from '../domain/tier.exception';
import { TierChangeType, TierHistory } from '../domain/model/tier-history.entity';
import { Tier } from '../domain/model/tier.entity';

@Injectable()
export class ProcessUserRollingService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
        @Inject(TIER_HISTORY_REPOSITORY)
        private readonly tierHistoryRepository: TierHistoryRepositoryPort,
    ) { }

    @Transactional()
    async execute(userId: bigint, amount: number): Promise<void> {
        // 1. Lock UserTier
        await this.userTierRepository.acquireLock(userId);

        // 2. Fetch UserTier
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) {
            throw new UserTierNotFoundException(userId);
        }

        // 3. Add Rolling Amount
        const rollingAmount = new Prisma.Decimal(amount);
        userTier.addRolling(rollingAmount);

        // 4. Check for Tier Upgrade
        const currentTier = userTier.tier;
        if (!currentTier) {
            // Should usually be present. If not, we might process rolling but skip upgrade logic
            // or fetch it. Assuming it's joined in findByUserId.
            // If missing, we can't compare priorities.
            await this.userTierRepository.update(userTier);
            return;
        }

        // Fetch all possible tiers to check higher priorities
        const allTiers = await this.tierRepository.findAll();

        // Filter tiers higher than current
        const candidates = allTiers
            .filter(t => t.priority > currentTier.priority)
            .sort((a, b) => b.priority - a.priority); // Descending priority

        let targetTier: Tier | null = null;
        for (const tier of candidates) {
            if (userTier.canUpgradeTo(tier)) {
                targetTier = tier;
                break; // Found highest satisfied tier
            }
        }

        if (targetTier) {
            // Check Bonus Eligibility BEFORE update (uses internal logic)
            const isBonusEligible = userTier.isEligibleForLevelUpBonus(targetTier);
            const bonusAmount = isBonusEligible
                ? targetTier.levelUpBonusUsd
                : new Prisma.Decimal(0);

            // Capture state for history
            const fromTierId = userTier.tierId;
            const rollingSnapshot = userTier.cumulativeRollingUsd;

            // Perform Update
            userTier.upgradeTo(targetTier);

            // Record History
            const history = TierHistory.create({
                userId,
                fromTierId,
                toTierId: targetTier.id!,
                changeType: TierChangeType.PROMOTION,
                reason: 'Rolling accumulation',
                rollingSnapshot,
                bonusAmount,
            });
            await this.tierHistoryRepository.create(history);
        }

        // 5. Persist UserTier changes
        await this.userTierRepository.update(userTier);
    }
}

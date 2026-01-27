import { Tier } from '../../core/domain/tier.entity';
import { UserTier } from '../../core/domain/user-tier.entity';

export class PromotionPolicy {
    /**
     * Check if the user qualifies for the next tier.
     * Returns the highest qualified tier that is higher than the current one.
     */
    static checkQualification(
        userTier: UserTier,
        allTiers: Tier[],
    ): Tier | null {
        if (!userTier.tier) return null;

        const currentPriority = userTier.tier.priority;

        // Filter tiers higher than current
        const higherTiers = allTiers
            .filter((t) => t.priority > currentPriority)
            .sort((a, b) => b.priority - a.priority); // Descending (check highest first)

        for (const nextTier of higherTiers) {
            if (nextTier.isSatisfiedBy(userTier.totalEffectiveRollingUsd)) {
                return nextTier;
            }
        }

        return null;
    }
}

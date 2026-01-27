import { UserTier } from '../../core/domain/user-tier.entity';
import { Tier } from '../../core/domain/tier.entity';
import { UserTierStatus } from '@prisma/client';

export interface DemotionResult {
    action: 'MAINTAIN' | 'GRACE' | 'DEMOTE';
    targetTier?: Tier;
    graceEndsAt?: Date;
}

export class DemotionPolicy {
    /**
     * Evaluate user for potential demotion.
     * 
     * Policy:
     * 1. If maintenance requirement met -> MAINTAIN
     * 2. If requirement NOT met:
     *    a. If already in GRACE and expired -> DEMOTE (Soft Landing: -1 level)
     *    b. If already in GRACE and NOT expired -> MAINTAIN (Wait)
     *    c. If active -> GRACE (Give 7 days chance)
     */
    static evaluate(
        userTier: UserTier,
        allTiers: Tier[],
    ): DemotionResult {
        if (!userTier.tier) return { action: 'MAINTAIN' };

        const requiredAmount = userTier.tier.maintenanceRollingUsd;

        // 1. Check Maintenance
        // Note: currentPeriodRollingUsd should be the rolling amount ACCUMULATED during the evaluation period.
        // Assuming the caller provides the correct period stats in userTier.currentPeriodRollingUsd
        const isMaintenanceMet = userTier.currentPeriodRollingUsd.gte(requiredAmount);

        if (isMaintenanceMet) {
            return { action: 'MAINTAIN' };
        }

        // 2. Not Met - Check Status
        if (userTier.isInGracePeriod()) {
            const now = new Date();
            if (userTier.graceEndsAt && userTier.graceEndsAt < now) {
                // Grace Expired -> Soft Landing Demotion
                const nextLowerTier = this.findNextLowerTier(userTier.tier, allTiers);
                if (nextLowerTier) {
                    return { action: 'DEMOTE', targetTier: nextLowerTier };
                } else {
                    // No lower tier? Maintain lowest (or handle as 'stay at bottom')
                    return { action: 'MAINTAIN' };
                }
            } else {
                // Grace Active -> Wait
                return { action: 'MAINTAIN' };
            }
        } else {
            // Current is ACTIVE but failed maintenance -> Enter GRACE
            const graceDurationDays = 7; // Policy constant
            const graceEndsAt = new Date();
            graceEndsAt.setDate(graceEndsAt.getDate() + graceDurationDays);

            return { action: 'GRACE', graceEndsAt };
        }
    }

    private static findNextLowerTier(currentTier: Tier, allTiers: Tier[]): Tier | undefined {
        // Soft Landing: Find the highest tier that is lower than current
        return allTiers
            .filter(t => t.priority < currentTier.priority)
            .sort((a, b) => b.priority - a.priority)[0]; // Highest of the lower ones
    }
}

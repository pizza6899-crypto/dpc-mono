import { Prisma } from '@prisma/client';

export class Tier {
    constructor(
        public readonly id: bigint,
        public readonly priority: number,
        public readonly code: string,

        // Requirements
        public readonly requirementUsd: Prisma.Decimal,
        public readonly requirementDepositUsd: Prisma.Decimal,
        public readonly maintenanceRollingUsd: Prisma.Decimal,

        // Benefits
        public readonly levelUpBonusUsd: Prisma.Decimal,
        public readonly levelUpBonusWageringMultiplier: Prisma.Decimal,
        public readonly compRate: Prisma.Decimal,
        public readonly lossbackRate: Prisma.Decimal,
        public readonly rakebackRate: Prisma.Decimal,
        public readonly reloadBonusRate: Prisma.Decimal,

        // Limits & Rights
        public readonly dailyWithdrawalLimitUsd: Prisma.Decimal,
        public readonly isWithdrawalUnlimited: boolean,
        public readonly hasDedicatedManager: boolean,
        public readonly isVIPEventEligible: boolean,

        // UI & Meta
        public readonly imageUrl: string | null,
        public readonly benefits: any | null, // JSON

        // Translation (Optional - for display)
        public readonly name: string | null = null,
        public readonly description: string | null = null,
    ) { }

    /**
     * Check if the rolling amount satisfies the requirement for this tier.
     */
    isSatisfiedBy(rollingAmount: Prisma.Decimal): boolean {
        return rollingAmount.gte(this.requirementUsd);
    }

    static fromPersistence(data: any): Tier {
        // If translation is joined, pick the first one (or handled by mapper)
        const translation = data.translations?.[0];

        return new Tier(
            data.id,
            data.priority,
            data.code,
            data.requirementUsd,
            data.requirementDepositUsd,
            data.maintenanceRollingUsd,
            data.levelUpBonusUsd,
            data.levelUpBonusWageringMultiplier,
            data.compRate,
            data.lossbackRate,
            data.rakebackRate,
            data.reloadBonusRate,
            data.dailyWithdrawalLimitUsd,
            data.isWithdrawalUnlimited,
            data.hasDedicatedManager,
            data.isVIPEventEligible,
            data.imageUrl,
            data.benefits,
            translation?.name ?? null,
            translation?.description ?? null,
        );
    }
}

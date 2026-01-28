import { Prisma, TierEvaluationCycle } from '@prisma/client';

export class Tier {
    constructor(
        public readonly id: bigint,
        public readonly priority: number,
        public readonly code: string,
        // Requirements
        public readonly requirementUsd: Prisma.Decimal,
        public readonly requirementDepositUsd: Prisma.Decimal,
        public readonly maintenanceRollingUsd: Prisma.Decimal,
        public readonly evaluationCycle: TierEvaluationCycle,
        // Benefits
        public readonly levelUpBonusUsd: Prisma.Decimal,
        public readonly levelUpBonusWageringMultiplier: Prisma.Decimal,
        public readonly compRate: Prisma.Decimal,
        public readonly lossbackRate: Prisma.Decimal,
        public readonly rakebackRate: Prisma.Decimal,
        public readonly reloadBonusRate: Prisma.Decimal,
        // Limits & Rules
        public readonly dailyWithdrawalLimitUsd: Prisma.Decimal,
        public readonly isWithdrawalUnlimited: boolean,
        public readonly hasDedicatedManager: boolean,
        public readonly isVIPEventEligible: boolean,
        // UI
        public readonly imageUrl: string | null,
        public readonly benefits: any | null,
        public readonly name: string | null = null,
        public readonly description: string | null = null,
    ) { }

    static fromPersistence(data: Prisma.TierGetPayload<{ include: { translations: true } }>): Tier {
        const translation = data.translations?.[0];
        return new Tier(
            data.id, data.priority, data.code,
            data.requirementUsd, data.requirementDepositUsd, data.maintenanceRollingUsd,
            data.evaluationCycle,
            data.levelUpBonusUsd, data.levelUpBonusWageringMultiplier,
            data.compRate, data.lossbackRate, data.rakebackRate, data.reloadBonusRate,
            data.dailyWithdrawalLimitUsd, data.isWithdrawalUnlimited,
            data.hasDedicatedManager, data.isVIPEventEligible,
            data.imageUrl, data.benefits,
            translation?.name ?? null, translation?.description ?? null
        );
    }
}

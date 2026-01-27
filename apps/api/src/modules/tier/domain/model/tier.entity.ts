import { Prisma } from '@prisma/client';
import { TierException } from '../tier.exception';

/**
 * Tier Definition Entity
 * 
 * Represents a tier level based on the current schema.
 */
export class Tier {
    private constructor(
        public readonly id: bigint | null,
        public readonly priority: number,
        public readonly code: string,
        public readonly requirementUsd: Prisma.Decimal,
        public readonly requirementDepositUsd: Prisma.Decimal,
        public readonly maintenanceRollingUsd: Prisma.Decimal,

        // Benefits
        public readonly levelUpBonusUsd: Prisma.Decimal,
        public readonly compRate: Prisma.Decimal,
        public readonly lossbackRate: Prisma.Decimal,
        public readonly rakebackRate: Prisma.Decimal,

        public readonly dailyWithdrawalLimitUsd: Prisma.Decimal,
        public readonly hasDedicatedManager: boolean,
        public readonly isVIPEventEligible: boolean,
        public readonly reloadBonusRate: Prisma.Decimal,

        public readonly createdAt: Date,
        public readonly updatedAt: Date,

        // Relation
        public readonly translations: { language: string; name: string }[] = [],

        // Joined Data
        public readonly displayName?: string,
    ) { }

    static create(params: {
        id?: bigint;
        priority: number;
        code: string;
        requirementUsd: Prisma.Decimal | number;
        requirementDepositUsd?: Prisma.Decimal | number;
        maintenanceRollingUsd?: Prisma.Decimal | number;

        levelUpBonusUsd?: Prisma.Decimal | number;
        compRate?: Prisma.Decimal | number;
        lossbackRate?: Prisma.Decimal | number;
        rakebackRate?: Prisma.Decimal | number;

        dailyWithdrawalLimitUsd?: Prisma.Decimal | number;
        hasDedicatedManager?: boolean;
        isVIPEventEligible?: boolean;
        reloadBonusRate?: Prisma.Decimal | number;

        displayName?: string;
        translations?: { language: string; name: string }[];
    }): Tier {
        const toDecimal = (val: Prisma.Decimal | number | undefined, df = 0) =>
            val instanceof Prisma.Decimal ? val : new Prisma.Decimal(val ?? df);

        const id = params.id ?? null;

        const translations = params.translations ?? [];
        const languages = new Set<string>();
        for (const t of translations) {
            if (languages.has(t.language)) {
                throw new TierException(`Duplicate language code in translations: ${t.language}`);
            }
            languages.add(t.language);
        }

        return new Tier(
            id,
            params.priority,
            params.code,
            toDecimal(params.requirementUsd),
            toDecimal(params.requirementDepositUsd),
            toDecimal(params.maintenanceRollingUsd),
            toDecimal(params.levelUpBonusUsd),
            toDecimal(params.compRate),
            toDecimal(params.lossbackRate),
            toDecimal(params.rakebackRate),
            toDecimal(params.dailyWithdrawalLimitUsd),
            params.hasDedicatedManager ?? false,
            params.isVIPEventEligible ?? false,
            toDecimal(params.reloadBonusRate),
            new Date(),
            new Date(),
            translations,
            params.displayName
        );
    }

    static fromPersistence(data: {
        id: bigint;
        priority: number;
        code: string;
        requirementUsd: Prisma.Decimal;
        requirementDepositUsd: Prisma.Decimal;
        maintenanceRollingUsd: Prisma.Decimal;
        levelUpBonusUsd: Prisma.Decimal;
        compRate: Prisma.Decimal;
        lossbackRate: Prisma.Decimal;
        rakebackRate: Prisma.Decimal;
        dailyWithdrawalLimitUsd: Prisma.Decimal;
        hasDedicatedManager: boolean;
        isVIPEventEligible: boolean;
        reloadBonusRate: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
        translations?: { language: string; name: string }[];
    }): Tier {
        return new Tier(
            data.id,
            data.priority,
            data.code,
            data.requirementUsd,
            data.requirementDepositUsd,
            data.maintenanceRollingUsd,
            data.levelUpBonusUsd,
            data.compRate,
            data.lossbackRate,
            data.rakebackRate,
            data.dailyWithdrawalLimitUsd,
            data.hasDedicatedManager,
            data.isVIPEventEligible,
            data.reloadBonusRate,
            data.createdAt,
            data.updatedAt,
            data.translations ?? [],
        );
    }

    toPersistence() {
        return {
            id: this.id ?? undefined,
            priority: this.priority,
            code: this.code,
            requirementUsd: this.requirementUsd,
            requirementDepositUsd: this.requirementDepositUsd,
            maintenanceRollingUsd: this.maintenanceRollingUsd,
            levelUpBonusUsd: this.levelUpBonusUsd,
            compRate: this.compRate,
            lossbackRate: this.lossbackRate,
            rakebackRate: this.rakebackRate,
            dailyWithdrawalLimitUsd: this.dailyWithdrawalLimitUsd,
            hasDedicatedManager: this.hasDedicatedManager,
            isVIPEventEligible: this.isVIPEventEligible,
            reloadBonusRate: this.reloadBonusRate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    isSatisfiedBy(amount: Prisma.Decimal): boolean {
        return amount.gte(this.requirementUsd);
    }
}

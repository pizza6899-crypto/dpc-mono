import { Prisma } from '@prisma/client';
import { generateUid } from 'src/utils/id.util';
import { TierException } from '../tier.exception';

/**
 * Tier Definition Entity
 * 
 * Represents a tier level based on the current schema.
 * - priority: Order of the tier
 * - code: Unique identifier (e.g. "BRONZE")
 * - requirementUsd: Cumulative rolling requirement
 */
export class Tier {
    private constructor(
        public readonly id: bigint | null,
        public readonly uid: string,
        public readonly priority: number,
        public readonly code: string,
        public readonly requirementUsd: Prisma.Decimal,

        // Benefits
        public readonly levelUpBonusUsd: Prisma.Decimal,
        public readonly compRate: Prisma.Decimal,
        public readonly affiliateCommissionRate: Prisma.Decimal,

        public readonly createdAt: Date,
        public readonly updatedAt: Date,

        // Relation
        public readonly translations: { language: string; name: string }[] = [],

        // Joined Data
        public readonly displayName?: string,
    ) { }

    static create(params: {
        id?: bigint; // Normally auto-generated, but can be passed
        uid?: string; // Normally auto-generated
        priority: number;
        code: string;
        requirementUsd: Prisma.Decimal | number;
        levelUpBonusUsd?: Prisma.Decimal | number;
        compRate?: Prisma.Decimal | number;
        affiliateCommissionRate?: Prisma.Decimal | number;
        displayName?: string;
        translations?: { language: string; name: string }[];
    }): Tier {
        const requirementUsd =
            params.requirementUsd instanceof Prisma.Decimal
                ? params.requirementUsd
                : new Prisma.Decimal(params.requirementUsd);

        const levelUpBonusUsd =
            params.levelUpBonusUsd instanceof Prisma.Decimal
                ? params.levelUpBonusUsd
                : new Prisma.Decimal(params.levelUpBonusUsd ?? 0);

        const compRate =
            params.compRate instanceof Prisma.Decimal
                ? params.compRate
                : new Prisma.Decimal(params.compRate ?? 0);

        const affiliateCommissionRate =
            params.affiliateCommissionRate instanceof Prisma.Decimal
                ? params.affiliateCommissionRate
                : new Prisma.Decimal(params.affiliateCommissionRate ?? 0);

        // Default empty ID/UID for creation if not provided (DB will handle)
        // However, domain entity should ideally have valid data. 
        // We strictly follow "New entity ... id=null or placeholder" until persisted.
        const id = params.id ?? null;
        const uid = params.uid ?? generateUid();

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
            uid,
            params.priority,
            params.code,
            requirementUsd,
            levelUpBonusUsd,
            compRate,
            affiliateCommissionRate,
            new Date(),
            new Date(),
            params.translations ?? [],
            params.displayName
        );
    }

    static fromPersistence(data: {
        id: bigint;
        uid: string;
        priority: number;
        code: string;
        requirementUsd: Prisma.Decimal;
        levelUpBonusUsd: Prisma.Decimal;
        compRate: Prisma.Decimal;
        affiliateCommissionRate: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
        translations?: { language: string; name: string }[];
    }): Tier {
        return new Tier(
            data.id,
            data.uid,
            data.priority,
            data.code,
            data.requirementUsd,
            data.levelUpBonusUsd,
            data.compRate,
            data.affiliateCommissionRate,
            data.createdAt,
            data.updatedAt,
            data.translations ?? [],
        );
    }

    toPersistence() {
        return {
            id: this.id,
            uid: this.uid, // Persist layer often ignores this on create
            priority: this.priority,
            code: this.code,
            requirementUsd: this.requirementUsd,
            levelUpBonusUsd: this.levelUpBonusUsd,
            compRate: this.compRate,
            affiliateCommissionRate: this.affiliateCommissionRate,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    isSatisfiedBy(amount: Prisma.Decimal): boolean {
        return amount.gte(this.requirementUsd);
    }
}

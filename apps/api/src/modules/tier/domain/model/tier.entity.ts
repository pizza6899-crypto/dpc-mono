import { Prisma } from '@repo/database';
import { generateUid } from 'src/utils/id.util';

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
        public readonly levelUpBonus: Prisma.Decimal,
        public readonly compRate: Prisma.Decimal,
        public readonly benefits: any, // JSON

        public readonly createdAt: Date,
        public readonly updatedAt: Date,

        // Joined Data
        public readonly displayName?: string,
    ) { }

    static create(params: {
        id?: bigint; // Normally auto-generated, but can be passed
        uid?: string; // Normally auto-generated
        priority: number;
        code: string;
        requirementUsd: Prisma.Decimal | number;
        levelUpBonus?: Prisma.Decimal | number;
        compRate?: Prisma.Decimal | number;
        benefits?: any;
        displayName?: string;
    }): Tier {
        const requirementUsd =
            params.requirementUsd instanceof Prisma.Decimal
                ? params.requirementUsd
                : new Prisma.Decimal(params.requirementUsd);

        const levelUpBonus =
            params.levelUpBonus instanceof Prisma.Decimal
                ? params.levelUpBonus
                : new Prisma.Decimal(params.levelUpBonus ?? 0);

        const compRate =
            params.compRate instanceof Prisma.Decimal
                ? params.compRate
                : new Prisma.Decimal(params.compRate ?? 0);

        // Default empty ID/UID for creation if not provided (DB will handle)
        // However, domain entity should ideally have valid data. 
        // We strictly follow "New entity ... id=null or placeholder" until persisted.
        const id = params.id ?? null;
        const uid = params.uid ?? generateUid();

        return new Tier(
            id,
            uid,
            params.priority,
            params.code,
            requirementUsd,
            levelUpBonus,
            compRate,
            params.benefits ?? {},
            new Date(),
            new Date(),
            params.displayName
        );
    }

    static fromPersistence(data: {
        id: bigint;
        uid: string;
        priority: number;
        code: string;
        requirementUsd: Prisma.Decimal;
        levelUpBonus: Prisma.Decimal;
        compRate: Prisma.Decimal;
        benefits: any;
        createdAt: Date;
        updatedAt: Date;
        displayName?: string;
    }): Tier {
        return new Tier(
            data.id,
            data.uid,
            data.priority,
            data.code,
            data.requirementUsd,
            data.levelUpBonus,
            data.compRate,
            data.benefits,
            data.createdAt,
            data.updatedAt,
            data.displayName
        );
    }

    toPersistence() {
        return {
            id: this.id,
            uid: this.uid, // Persist layer often ignores this on create
            priority: this.priority,
            code: this.code,
            requirementUsd: this.requirementUsd,
            levelUpBonus: this.levelUpBonus,
            compRate: this.compRate,
            benefits: this.benefits,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    isSatisfiedBy(amount: Prisma.Decimal): boolean {
        return amount.gte(this.requirementUsd);
    }
}

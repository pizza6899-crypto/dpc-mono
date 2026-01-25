import { Prisma } from '@prisma/client';

export class CompConfig {
    private constructor(
        public readonly id: bigint,
        public readonly isEarnEnabled: boolean,
        public readonly isClaimEnabled: boolean,
        public readonly allowNegativeBalance: boolean,
        public readonly minClaimAmount: Prisma.Decimal,
        public readonly maxDailyEarnPerUser: Prisma.Decimal,
        public readonly expirationDays: number,
        public readonly description: string | null,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        isEarnEnabled?: boolean;
        isClaimEnabled?: boolean;
        allowNegativeBalance?: boolean;
        minClaimAmount?: Prisma.Decimal;
        maxDailyEarnPerUser?: Prisma.Decimal;
        expirationDays?: number;
        description?: string;
    }): CompConfig {
        return new CompConfig(
            BigInt(0), // ID is assigned by DB
            params.isEarnEnabled ?? true,
            params.isClaimEnabled ?? true,
            params.allowNegativeBalance ?? true,
            params.minClaimAmount ?? new Prisma.Decimal(0.01),
            params.maxDailyEarnPerUser ?? new Prisma.Decimal(0),
            params.expirationDays ?? 365,
            params.description ?? null,
            new Date(),
        );
    }

    static rehydrate(params: {
        id: bigint;
        isEarnEnabled: boolean;
        isClaimEnabled: boolean;
        allowNegativeBalance: boolean;
        minClaimAmount: Prisma.Decimal;
        maxDailyEarnPerUser: Prisma.Decimal;
        expirationDays: number;
        description: string | null;
        updatedAt: Date;
    }): CompConfig {
        return new CompConfig(
            params.id,
            params.isEarnEnabled,
            params.isClaimEnabled,
            params.allowNegativeBalance,
            params.minClaimAmount,
            params.maxDailyEarnPerUser,
            params.expirationDays,
            params.description,
            params.updatedAt,
        );
    }

    canEarn(): boolean {
        return this.isEarnEnabled;
    }

    canClaim(amount: Prisma.Decimal): boolean {
        if (!this.isClaimEnabled) return false;
        if (amount.lessThan(this.minClaimAmount)) return false;
        return true;
    }
}

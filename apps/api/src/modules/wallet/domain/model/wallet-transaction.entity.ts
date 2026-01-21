import { ExchangeCurrencyCode, Prisma, WalletBalanceType, WalletTransactionType } from "@prisma/client";

export class WalletTransaction {
    private constructor(
        // Identity
        public readonly id: bigint | null,
        public readonly createdAt: Date,

        // Core fields
        public readonly type: WalletTransactionType,
        public readonly balanceType: WalletBalanceType,
        public readonly amount: Prisma.Decimal,
        public readonly balanceAfter: Prisma.Decimal,

        // Reference
        public readonly referenceId: string | null, // Game ID, Deposit ID etc.
        public readonly remark: string | null,      // Human readable note

        // Security/Audit
        public readonly ipAddress: string | null,
        public readonly countryCode: string | null,

        // Foreign Keys
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
    ) { }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        type: WalletTransactionType;
        balanceType: WalletBalanceType;
        amount: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        referenceId?: string;
        remark?: string;
        ipAddress?: string;
        countryCode?: string;
        createdAt?: Date; // Optional, defaults to now if not provided
    }): WalletTransaction {
        return new WalletTransaction(
            null, // ID is auto-generated
            params.createdAt ?? new Date(),
            params.type,
            params.balanceType,
            params.amount,
            params.balanceAfter,
            params.referenceId ?? null,
            params.remark ?? null,
            params.ipAddress ?? null,
            params.countryCode ?? null,
            params.userId,
            params.currency,
        );
    }

    static fromPersistence(data: {
        id: bigint;
        createdAt: Date;
        type: WalletTransactionType;
        balanceType: WalletBalanceType;
        amount: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        referenceId: string | null;
        remark: string | null;
        ipAddress: string | null;
        countryCode: string | null;
        userId: bigint;
        currency: ExchangeCurrencyCode;
    }): WalletTransaction {
        return new WalletTransaction(
            data.id,
            data.createdAt,
            data.type,
            data.balanceType,
            data.amount,
            data.balanceAfter,
            data.referenceId,
            data.remark,
            data.ipAddress,
            data.countryCode,
            data.userId,
            data.currency,
        );
    }
}


import { CompTransactionType, Prisma } from 'src/generated/prisma';

export class CompTransaction {
    private constructor(
        public readonly id: bigint,
        public readonly compWalletId: bigint,
        public readonly amount: Prisma.Decimal,
        public readonly balanceAfter: Prisma.Decimal,
        public readonly type: CompTransactionType,
        public readonly referenceId: string | null,
        public readonly description: string | null,
        public readonly createdAt: Date,
    ) { }

    static create(params: {
        compWalletId: bigint;
        amount: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        type: CompTransactionType;
        referenceId?: string;
        description?: string;
    }): CompTransaction {
        return new CompTransaction(
            BigInt(0), // ID is assigned by DB
            params.compWalletId,
            params.amount,
            params.balanceAfter,
            params.type,
            params.referenceId ?? null,
            params.description ?? null,
            new Date(),
        );
    }

    /**
     * Rehydrate a CompTransaction from persistence layer.
     * Used by repository/mapper only.
     */
    static rehydrate(params: {
        id: bigint;
        compWalletId: bigint;
        amount: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        type: CompTransactionType;
        referenceId: string | null;
        description: string | null;
        createdAt: Date;
    }): CompTransaction {
        return new CompTransaction(
            params.id,
            params.compWalletId,
            params.amount,
            params.balanceAfter,
            params.type,
            params.referenceId,
            params.description,
            params.createdAt,
        );
    }
}

import { CompTransactionType, Prisma } from '@prisma/client';

export class CompTransaction {
    private constructor(
        public readonly id: bigint,
        public readonly compWalletId: bigint,
        public readonly amount: Prisma.Decimal,
        public readonly balanceBefore: Prisma.Decimal, // [추가]
        public readonly balanceAfter: Prisma.Decimal,
        public readonly appliedRate: Prisma.Decimal | null, // [추가]
        public readonly type: CompTransactionType,
        public readonly referenceId: bigint | null, // [변경] string -> bigint
        public readonly description: string | null,
        public readonly createdAt: Date,
    ) { }

    static create(params: {
        compWalletId: bigint;
        amount: Prisma.Decimal;
        balanceBefore: Prisma.Decimal; // [추가]
        balanceAfter: Prisma.Decimal;
        appliedRate?: Prisma.Decimal | null; // [추가]
        type: CompTransactionType;
        referenceId?: bigint; // [변경]
        description?: string;
    }): CompTransaction {
        return new CompTransaction(
            BigInt(0), // ID is assigned by DB
            params.compWalletId,
            params.amount,
            params.balanceBefore,
            params.balanceAfter,
            params.appliedRate ?? null,
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
        balanceBefore: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        appliedRate: Prisma.Decimal | null;
        type: CompTransactionType;
        referenceId: bigint | null;
        description: string | null;
        createdAt: Date;
    }): CompTransaction {
        return new CompTransaction(
            params.id,
            params.compWalletId,
            params.amount,
            params.balanceBefore,
            params.balanceAfter,
            params.appliedRate,
            params.type,
            params.referenceId,
            params.description,
            params.createdAt,
        );
    }
}

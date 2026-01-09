import { CompTransactionType, Prisma } from '@repo/database';

export class CompTransaction {
    constructor(
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
        id?: bigint;
        compWalletId: bigint;
        amount: Prisma.Decimal;
        balanceAfter: Prisma.Decimal;
        type: CompTransactionType;
        referenceId?: string;
        description?: string;
        createdAt?: Date;
    }): CompTransaction {
        return new CompTransaction(
            params.id ?? BigInt(0),
            params.compWalletId,
            params.amount,
            params.balanceAfter,
            params.type,
            params.referenceId ?? null,
            params.description ?? null,
            params.createdAt ?? new Date(),
        );
    }
}

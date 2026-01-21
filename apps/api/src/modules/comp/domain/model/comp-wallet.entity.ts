import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { InsufficientCompBalanceException } from '../comp.exception';

export class CompWallet {
    private constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
        public readonly balance: Prisma.Decimal,
        public readonly totalEarned: Prisma.Decimal,
        public readonly totalUsed: Prisma.Decimal,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        balance?: Prisma.Decimal;
        totalEarned?: Prisma.Decimal;
        totalUsed?: Prisma.Decimal;
    }): CompWallet {
        return new CompWallet(
            BigInt(0), // ID is assigned by DB
            params.userId,
            params.currency,
            params.balance ?? new Prisma.Decimal(0),
            params.totalEarned ?? new Prisma.Decimal(0),
            params.totalUsed ?? new Prisma.Decimal(0),
            new Date(),
            new Date(),
        );
    }

    /**
     * Rehydrate a CompWallet from persistence layer.
     * Used by repository/mapper only.
     */
    static rehydrate(params: {
        id: bigint;
        userId: bigint;
        currency: ExchangeCurrencyCode;
        balance: Prisma.Decimal;
        totalEarned: Prisma.Decimal;
        totalUsed: Prisma.Decimal;
        createdAt: Date;
        updatedAt: Date;
    }): CompWallet {
        return new CompWallet(
            params.id,
            params.userId,
            params.currency,
            params.balance,
            params.totalEarned,
            params.totalUsed,
            params.createdAt,
            params.updatedAt,
        );
    }

    earn(amount: Prisma.Decimal): CompWallet {
        return new CompWallet(
            this.id,
            this.userId,
            this.currency,
            this.balance.add(amount),
            this.totalEarned.add(amount),
            this.totalUsed,
            this.createdAt,
            new Date(),
        );
    }

    claim(amount: Prisma.Decimal): CompWallet {
        if (this.balance.lessThan(amount)) {
            throw new InsufficientCompBalanceException(
                this.userId,
                amount.toString(),
                this.balance.toString()
            );
        }

        return new CompWallet(
            this.id,
            this.userId,
            this.currency,
            this.balance.sub(amount),
            this.totalEarned,
            this.totalUsed.add(amount),
            this.createdAt,
            new Date(),
        );
    }

    deduct(amount: Prisma.Decimal): CompWallet {
        if (this.balance.lessThan(amount)) {
            throw new InsufficientCompBalanceException(
                this.userId,
                amount.toString(),
                this.balance.toString()
            );
        }

        return new CompWallet(
            this.id,
            this.userId,
            this.currency,
            this.balance.sub(amount),
            this.totalEarned,
            this.totalUsed.add(amount), // Also count as used/deducted
            this.createdAt,
            new Date(),
        );
    }
}

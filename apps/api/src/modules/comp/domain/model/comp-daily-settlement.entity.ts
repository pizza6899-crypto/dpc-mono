import { CompSettlementStatus, ExchangeCurrencyCode, Prisma } from '@prisma/client';

export class CompDailySettlement {
    private constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
        public readonly date: Date,
        public readonly totalEarned: Prisma.Decimal,
        public readonly status: CompSettlementStatus,
        public readonly rewardId: bigint | null,
        public readonly failureReason: string | null,
        public readonly processedAt: Date | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        id?: bigint;
        userId: bigint;
        currency: ExchangeCurrencyCode;
        date: Date;
        totalEarned?: Prisma.Decimal;
        status?: CompSettlementStatus;
    }): CompDailySettlement {
        return new CompDailySettlement(
            params.id ?? 0n,
            params.userId,
            params.currency,
            params.date,
            params.totalEarned ?? new Prisma.Decimal(0),
            params.status ?? CompSettlementStatus.UNSETTLED,
            null,
            null,
            null,
            new Date(),
            new Date(),
        );
    }

    static rehydrate(params: {
        id: bigint;
        userId: bigint;
        currency: ExchangeCurrencyCode;
        date: Date;
        totalEarned: Prisma.Decimal;
        status: CompSettlementStatus;
        rewardId: bigint | null;
        failureReason: string | null;
        processedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }): CompDailySettlement {
        return new CompDailySettlement(
            params.id,
            params.userId,
            params.currency,
            params.date,
            params.totalEarned,
            params.status,
            params.rewardId,
            params.failureReason,
            params.processedAt,
            params.createdAt,
            params.updatedAt,
        );
    }

    addEarn(amount: Prisma.Decimal): CompDailySettlement {
        return new CompDailySettlement(
            this.id,
            this.userId,
            this.currency,
            this.date,
            this.totalEarned.add(amount),
            this.status,
            this.rewardId,
            this.failureReason,
            this.processedAt,
            this.createdAt,
            new Date(),
        );
    }
}

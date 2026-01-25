import { Prisma, CasinoGameTransactionType, WalletBalanceType, ExchangeCurrencyCode } from "@prisma/client";

export class GameTransaction {
    constructor(
        public readonly id: bigint,
        public readonly gameRoundId: bigint,
        public readonly roundStartedAt: Date, // 파티셔닝 키 (부모 라운드 시작 시간)
        public readonly userId: bigint,
        public readonly type: CasinoGameTransactionType,
        public readonly aggregatorTxId: string,

        // 금액 정보
        public readonly amount: Prisma.Decimal, // Wallet Currency
        public readonly balanceBefore: Prisma.Decimal, // 변동 전 잔액 (검증용)
        public readonly gameAmount: Prisma.Decimal | null, // Game Currency (원본)
        public readonly balanceType: WalletBalanceType,
        public readonly currency: ExchangeCurrencyCode, // Wallet Currency

        public readonly createdAt: Date,
    ) { }

    public static create(
        id: bigint,
        gameRoundId: bigint,
        roundStartedAt: Date,
        userId: bigint,
        type: CasinoGameTransactionType,
        aggregatorTxId: string,
        amount: Prisma.Decimal,
        balanceBefore: Prisma.Decimal,
        gameAmount: Prisma.Decimal | null,
        balanceType: WalletBalanceType,
        currency: ExchangeCurrencyCode,
        createdAt: Date = new Date(),
    ): GameTransaction {
        return new GameTransaction(
            id,
            gameRoundId,
            roundStartedAt,
            userId,
            type,
            aggregatorTxId,
            amount,
            balanceBefore,
            gameAmount,
            balanceType,
            currency,
            createdAt,
        );
    }

    public static fromPersistence(data: any): GameTransaction {
        return new GameTransaction(
            data.id,
            data.gameRoundId,
            data.roundStartedAt,
            data.userId,
            data.type,
            data.aggregatorTxId,
            data.amount,
            data.balanceBefore,
            data.gameAmount,
            data.balanceType,
            data.currency,
            data.createdAt,
        );
    }
}

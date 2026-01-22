import { Prisma, GameProvider, GameAggregatorType, ExchangeCurrencyCode } from "@prisma/client";
import { GameTransaction } from "./game-transaction.entity";

export class GameRound {
    constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public readonly gameSessionId: bigint,
        public readonly gameId: bigint,
        public readonly provider: GameProvider,
        public readonly aggregatorType: GameAggregatorType,
        public readonly aggregatorRoundId: string,

        // 스냅샷
        public readonly currency: ExchangeCurrencyCode,
        public readonly gameCurrency: ExchangeCurrencyCode,
        public readonly exchangeRate: Prisma.Decimal,

        // 통계 (합계)
        public totalBetAmount: Prisma.Decimal,
        public totalWinAmount: Prisma.Decimal,
        public totalGameBetAmount: Prisma.Decimal,
        public totalGameWinAmount: Prisma.Decimal,

        // 상태 및 시간
        public readonly startedAt: Date,
        public completedAt: Date | null,
        public isCompleted: boolean,

        // 관계 (Optional)
        public readonly transactions?: GameTransaction[],
    ) { }

    public static create(
        id: bigint,
        userId: bigint,
        gameSessionId: bigint,
        gameId: bigint,
        provider: GameProvider,
        aggregatorType: GameAggregatorType,
        aggregatorRoundId: string,
        currency: ExchangeCurrencyCode,
        gameCurrency: ExchangeCurrencyCode,
        exchangeRate: Prisma.Decimal,
        startedAt: Date,
    ): GameRound {
        return new GameRound(
            id,
            userId,
            gameSessionId,
            gameId,
            provider,
            aggregatorType,
            aggregatorRoundId,
            currency,
            gameCurrency,
            exchangeRate,
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            startedAt,
            null,
            false,
        );
    }

    public static fromPersistence(data: any): GameRound {
        return new GameRound(
            data.id,
            data.userId,
            data.gameSessionId,
            data.gameId,
            data.provider,
            data.aggregatorType,
            data.aggregatorRoundId,
            data.currency,
            data.gameCurrency,
            data.exchangeRate,
            data.totalBetAmount,
            data.totalWinAmount,
            data.totalGameBetAmount,
            data.totalGameWinAmount,
            data.startedAt,
            data.completedAt,
            data.isCompleted,
            data.transactions?.map((tx: any) => GameTransaction.fromPersistence(tx)),
        );
    }

    public complete(): void {
        this.completedAt = new Date();
        this.isCompleted = true;
    }

    public addBet(amount: Prisma.Decimal, gameAmount: Prisma.Decimal | null): void {
        this.totalBetAmount = this.totalBetAmount.add(amount);
        if (gameAmount) {
            this.totalGameBetAmount = this.totalGameBetAmount.add(gameAmount);
        }
    }

    public addWin(amount: Prisma.Decimal, gameAmount: Prisma.Decimal | null): void {
        this.totalWinAmount = this.totalWinAmount.add(amount);
        if (gameAmount) {
            this.totalGameWinAmount = this.totalGameWinAmount.add(gameAmount);
        }
    }
}

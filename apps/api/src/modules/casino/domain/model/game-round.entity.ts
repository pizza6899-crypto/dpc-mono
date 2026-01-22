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
        if (this.isCompleted) return;

        this.completedAt = new Date();
        this.isCompleted = true;
    }

    public addBet(amount: Prisma.Decimal, gameAmount: Prisma.Decimal | null): void {
        if (this.isCompleted) {
            throw new Error(`Cannot add bet to a completed round: ${this.id}`);
        }
        if (amount.isNegative()) {
            throw new Error(`Bet amount cannot be negative: ${amount.toString()}`);
        }

        this.totalBetAmount = this.totalBetAmount.add(amount);
        if (gameAmount) {
            this.totalGameBetAmount = this.totalGameBetAmount.add(gameAmount);
        }
    }

    public addWin(amount: Prisma.Decimal, gameAmount: Prisma.Decimal | null): void {
        // Late win (라운드 종료 후 당첨) 처리가 필요한 경우가 있어 guard를 두지 않거나 경고만 남깁니다.
        if (amount.isNegative()) {
            throw new Error(`Win amount cannot be negative: ${amount.toString()}`);
        }

        this.totalWinAmount = this.totalWinAmount.add(amount);
        if (gameAmount) {
            this.totalGameWinAmount = this.totalGameWinAmount.add(gameAmount);
        }
    }

    /**
     * GGR (Gross Gaming Revenue): 순수익 (Bet - Win)
     */
    public get ggr(): Prisma.Decimal {
        return this.totalBetAmount.sub(this.totalWinAmount);
    }

    /**
     * RTP (Return to Player): 유저 환급률 (%)
     */
    public get rtp(): number {
        if (this.totalBetAmount.isZero()) return 0;
        return this.totalWinAmount.div(this.totalBetAmount).mul(100).toNumber();
    }
}

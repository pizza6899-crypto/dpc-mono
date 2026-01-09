import {
    GameAggregatorType,
    ExchangeCurrencyCode,
    Prisma,
} from '@repo/database';

export class CasinoGameSession {
    private constructor(
        public readonly id: bigint | null,
        public readonly uid: string,
        public readonly userId: bigint,
        public readonly playerName: string,
        public readonly token: string,
        public readonly aggregatorType: GameAggregatorType,
        public readonly walletCurrency: ExchangeCurrencyCode,
        public readonly gameCurrency: ExchangeCurrencyCode,
        public readonly exchangeRate: Prisma.Decimal,
        public readonly exchangeRateSnapshotAt: Date,
        public readonly usdExchangeRate: Prisma.Decimal,
        public readonly casinoGameId: bigint | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly lastAccessedAt: Date,
    ) { }

    static create(params: {
        id?: bigint;
        uid: string;
        userId: bigint;
        playerName: string;
        token: string;
        aggregatorType: GameAggregatorType;
        walletCurrency: ExchangeCurrencyCode;
        gameCurrency: ExchangeCurrencyCode;
        exchangeRate: Prisma.Decimal;
        exchangeRateSnapshotAt?: Date;
        usdExchangeRate?: Prisma.Decimal;
        casinoGameId?: bigint | null;
        createdAt?: Date;
        updatedAt?: Date;
        lastAccessedAt?: Date;
    }): CasinoGameSession {
        return new CasinoGameSession(
            params.id ?? null,
            params.uid,
            params.userId,
            params.playerName,
            params.token,
            params.aggregatorType,
            params.walletCurrency,
            params.gameCurrency,
            params.exchangeRate,
            params.exchangeRateSnapshotAt ?? new Date(),
            params.usdExchangeRate ?? new Prisma.Decimal(1),
            params.casinoGameId ?? null,
            params.createdAt ?? new Date(),
            params.updatedAt ?? new Date(),
            params.lastAccessedAt ?? new Date(),
        );
    }

    // 비즈니스 로직 예시 (필요시 추가)
    // hasExpired(): boolean { ... }
}

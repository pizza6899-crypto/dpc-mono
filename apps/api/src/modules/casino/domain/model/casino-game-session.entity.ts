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
        public readonly token: string,
        public readonly aggregatorType: GameAggregatorType,
        public readonly walletCurrency: ExchangeCurrencyCode,
        public readonly gameCurrency: ExchangeCurrencyCode,
        public readonly exchangeRate: Prisma.Decimal,
        public readonly exchangeRateSnapshotAt: Date,
        public readonly gameId: bigint | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly lastAccessedAt: Date,
    ) { }

    static create(params: {
        id?: bigint;
        uid: string;
        userId: bigint;
        token: string;
        aggregatorType: GameAggregatorType;
        walletCurrency: ExchangeCurrencyCode;
        gameCurrency: ExchangeCurrencyCode;
        exchangeRate: Prisma.Decimal;
        exchangeRateSnapshotAt?: Date;
        gameId?: bigint | null;
        createdAt?: Date;
        updatedAt?: Date;
        lastAccessedAt?: Date;
    }): CasinoGameSession {
        return new CasinoGameSession(
            params.id ?? null,
            params.uid,
            params.userId,
            params.token,
            params.aggregatorType,
            params.walletCurrency,
            params.gameCurrency,
            params.exchangeRate,
            params.exchangeRateSnapshotAt ?? new Date(),
            params.gameId ?? null,
            params.createdAt ?? new Date(),
            params.updatedAt ?? new Date(),
            params.lastAccessedAt ?? new Date(),
        );
    }

    // 비즈니스 로직 예시 (필요시 추가)
    // hasExpired(): boolean { ... }
}

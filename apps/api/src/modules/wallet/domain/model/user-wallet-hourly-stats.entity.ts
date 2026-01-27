import { ExchangeCurrencyCode, Prisma } from '@prisma/client';

/**
 * UserWalletHourlyStats 도메인 엔티티
 * 
 * 시간대별 지갑 통계 및 잔액 스냅샷을 관리합니다.
 * 현금(Cash)과 보너스(Bonus) 흐름을 분리하여 기록합니다.
 */
export class UserWalletHourlyStats {
    private constructor(
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
        public readonly date: Date, // YYYY-MM-DD HH:00:00 (Must be UTC) / 반드시 UTC 기준으로 저장

        // Cash Flow
        private _totalDepositCash: Prisma.Decimal,
        private _totalWithdrawCash: Prisma.Decimal,
        private _totalBetCash: Prisma.Decimal,
        private _totalWinCash: Prisma.Decimal,

        // USD Statistics
        private _totalDepositCashUsd: Prisma.Decimal,
        private _totalWithdrawCashUsd: Prisma.Decimal,
        private _totalBetCashUsd: Prisma.Decimal,
        private _totalWinCashUsd: Prisma.Decimal,

        // Hall of Fame
        private _maxBetAmount: Prisma.Decimal,
        private _maxWinAmount: Prisma.Decimal,
        private _maxWinAmountUsd: Prisma.Decimal,

        // Count Statistics
        private _totalBetCount: bigint,
        private _totalWinCount: bigint,
        private _transactionCount: bigint,

        // Bonus Flow
        private _totalBonusGiven: Prisma.Decimal,
        private _totalBonusUsed: Prisma.Decimal,
        private _totalBetBonus: Prisma.Decimal,
        private _totalWinBonus: Prisma.Decimal,

        // Recency Statistics
        public lastBetAt: Date | null,
        public lastWinAt: Date | null,
        public lastDepositAt: Date | null,
        public lastWithdrawAt: Date | null,

        // Snapshots
        private _startCash: Prisma.Decimal,
        private _endCash: Prisma.Decimal,
        private _startBonus: Prisma.Decimal,
        private _endBonus: Prisma.Decimal,

        public readonly createdAt: Date,
    ) { }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        date: Date;
        startCash: Prisma.Decimal;
        startBonus: Prisma.Decimal;
    }): UserWalletHourlyStats {
        return new UserWalletHourlyStats(
            params.userId,
            params.currency,
            params.date,
            // Cash Flow
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            // USD Statistics
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            // Hall of Fame
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            // Count Statistics
            BigInt(0),
            BigInt(0),
            BigInt(0),
            // Bonus Flow
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            // Recency
            null,
            null,
            null,
            null,
            // Snapshots
            params.startCash,
            params.startCash, // 초기 end값은 start와 동일
            params.startBonus,
            params.startBonus, // 초기 end값은 start와 동일
            new Date(),
        );
    }

    static fromPersistence(data: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        date: Date;
        totalDepositCash: Prisma.Decimal;
        totalWithdrawCash: Prisma.Decimal;
        totalBetCash: Prisma.Decimal;
        totalWinCash: Prisma.Decimal;
        // USD
        totalDepositCashUsd: Prisma.Decimal;
        totalWithdrawCashUsd: Prisma.Decimal;
        totalBetCashUsd: Prisma.Decimal;
        totalWinCashUsd: Prisma.Decimal;
        // Hall of Fame
        maxBetAmount: Prisma.Decimal;
        maxWinAmount: Prisma.Decimal;
        maxWinAmountUsd: Prisma.Decimal;
        // Count
        totalBetCount: bigint;
        totalWinCount: bigint;
        transactionCount: bigint;
        // Bonus
        totalBonusGiven: Prisma.Decimal;
        totalBonusUsed: Prisma.Decimal;
        totalBetBonus: Prisma.Decimal;
        totalWinBonus: Prisma.Decimal;
        // Recency
        lastBetAt: Date | null;
        lastWinAt: Date | null;
        lastDepositAt: Date | null;
        lastWithdrawAt: Date | null;
        // Snapshots
        startCash: Prisma.Decimal;
        endCash: Prisma.Decimal;
        startBonus: Prisma.Decimal;
        endBonus: Prisma.Decimal;
        createdAt: Date;
    }): UserWalletHourlyStats {
        return new UserWalletHourlyStats(
            data.userId,
            data.currency,
            data.date,
            data.totalDepositCash,
            data.totalWithdrawCash,
            data.totalBetCash,
            data.totalWinCash,
            data.totalDepositCashUsd,
            data.totalWithdrawCashUsd,
            data.totalBetCashUsd,
            data.totalWinCashUsd,
            data.maxBetAmount,
            data.maxWinAmount,
            data.maxWinAmountUsd,
            data.totalBetCount,
            data.totalWinCount,
            data.transactionCount,
            data.totalBonusGiven,
            data.totalBonusUsed,
            data.totalBetBonus,
            data.totalWinBonus,
            data.lastBetAt,
            data.lastWinAt,
            data.lastDepositAt,
            data.lastWithdrawAt,
            data.startCash,
            data.endCash,
            data.startBonus,
            data.endBonus,
            data.createdAt,
        );
    }

    // Getters
    get totalDepositCash(): Prisma.Decimal { return this._totalDepositCash; }
    get totalWithdrawCash(): Prisma.Decimal { return this._totalWithdrawCash; }
    get totalBetCash(): Prisma.Decimal { return this._totalBetCash; }
    get totalWinCash(): Prisma.Decimal { return this._totalWinCash; }
    // USD
    get totalDepositCashUsd(): Prisma.Decimal { return this._totalDepositCashUsd; }
    get totalWithdrawCashUsd(): Prisma.Decimal { return this._totalWithdrawCashUsd; }
    get totalBetCashUsd(): Prisma.Decimal { return this._totalBetCashUsd; }
    get totalWinCashUsd(): Prisma.Decimal { return this._totalWinCashUsd; }
    // Hall of Fame
    get maxBetAmount(): Prisma.Decimal { return this._maxBetAmount; }
    get maxWinAmount(): Prisma.Decimal { return this._maxWinAmount; }
    get maxWinAmountUsd(): Prisma.Decimal { return this._maxWinAmountUsd; }
    // Count
    get totalBetCount(): bigint { return this._totalBetCount; }
    get totalWinCount(): bigint { return this._totalWinCount; }
    get transactionCount(): bigint { return this._transactionCount; }
    // Bonus
    get totalBonusGiven(): Prisma.Decimal { return this._totalBonusGiven; }
    get totalBonusUsed(): Prisma.Decimal { return this._totalBonusUsed; }
    get totalBetBonus(): Prisma.Decimal { return this._totalBetBonus; }
    get totalWinBonus(): Prisma.Decimal { return this._totalWinBonus; }
    // Snapshots
    get startCash(): Prisma.Decimal { return this._startCash; }
    get endCash(): Prisma.Decimal { return this._endCash; }
    get startBonus(): Prisma.Decimal { return this._startBonus; }
    get endBonus(): Prisma.Decimal { return this._endBonus; }


    // Analytics Methods
    get cashGgr(): Prisma.Decimal {
        return this._totalBetCash.sub(this._totalWinCash);
    }

    get bonusGgr(): Prisma.Decimal {
        return this._totalBetBonus.sub(this._totalWinBonus);
    }

    get totalGgr(): Prisma.Decimal {
        return this.cashGgr.add(this.bonusGgr);
    }
}

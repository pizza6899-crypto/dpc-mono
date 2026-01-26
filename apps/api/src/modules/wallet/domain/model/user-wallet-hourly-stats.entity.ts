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
        public readonly date: Date, // YYYY-MM-DD HH:00:00 (정시 기준)

        // Cash Flow
        private _totalDepositCash: Prisma.Decimal,
        private _totalWithdrawCash: Prisma.Decimal,
        private _totalBetCash: Prisma.Decimal,
        private _totalWinCash: Prisma.Decimal,

        // Bonus Flow
        private _totalBonusGiven: Prisma.Decimal,
        private _totalBonusUsed: Prisma.Decimal,
        private _totalBetBonus: Prisma.Decimal,
        private _totalWinBonus: Prisma.Decimal,

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
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
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
        totalBonusGiven: Prisma.Decimal;
        totalBonusUsed: Prisma.Decimal;
        totalBetBonus: Prisma.Decimal;
        totalWinBonus: Prisma.Decimal;
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
            data.totalBonusGiven,
            data.totalBonusUsed,
            data.totalBetBonus,
            data.totalWinBonus,
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
    get totalBonusGiven(): Prisma.Decimal { return this._totalBonusGiven; }
    get totalBonusUsed(): Prisma.Decimal { return this._totalBonusUsed; }
    get totalBetBonus(): Prisma.Decimal { return this._totalBetBonus; }
    get totalWinBonus(): Prisma.Decimal { return this._totalWinBonus; }
    get startCash(): Prisma.Decimal { return this._startCash; }
    get endCash(): Prisma.Decimal { return this._endCash; }
    get startBonus(): Prisma.Decimal { return this._startBonus; }
    get endBonus(): Prisma.Decimal { return this._endBonus; }

    // Update Logic
    recordCashFlow(params: {
        deposit?: Prisma.Decimal;
        withdraw?: Prisma.Decimal;
        bet?: Prisma.Decimal;
        win?: Prisma.Decimal;
        finalCash: Prisma.Decimal;
    }): void {
        if (params.deposit) this._totalDepositCash = this._totalDepositCash.add(params.deposit);
        if (params.withdraw) this._totalWithdrawCash = this._totalWithdrawCash.add(params.withdraw);
        if (params.bet) this._totalBetCash = this._totalBetCash.add(params.bet);
        if (params.win) this._totalWinCash = this._totalWinCash.add(params.win);
        this._endCash = params.finalCash;
    }

    recordBonusFlow(params: {
        given?: Prisma.Decimal;
        used?: Prisma.Decimal;
        bet?: Prisma.Decimal;
        win?: Prisma.Decimal;
        finalBonus: Prisma.Decimal;
    }): void {
        if (params.given) this._totalBonusGiven = this._totalBonusGiven.add(params.given);
        if (params.used) this._totalBonusUsed = this._totalBonusUsed.add(params.used);
        if (params.bet) this._totalBetBonus = this._totalBetBonus.add(params.bet);
        if (params.win) this._totalWinBonus = this._totalWinBonus.add(params.win);
        this._endBonus = params.finalBonus;
    }

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

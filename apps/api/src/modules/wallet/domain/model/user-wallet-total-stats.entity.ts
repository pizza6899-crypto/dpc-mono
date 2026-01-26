import { ExchangeCurrencyCode, Prisma } from '@prisma/client';

/**
 * UserWalletTotalStats 도메인 엔티티
 * 
 * 유저별/통화별 누적 통계(Life-time)를 관리합니다.
 */
export class UserWalletTotalStats {
    private constructor(
        public readonly userId: bigint,
        public readonly currency: ExchangeCurrencyCode,
        private _totalDeposit: Prisma.Decimal,
        private _totalWithdraw: Prisma.Decimal,
        private _totalBet: Prisma.Decimal,
        private _totalWin: Prisma.Decimal,
        private _totalBonus: Prisma.Decimal,
        private _totalCompEarned: Prisma.Decimal,
        private _totalCompUsed: Prisma.Decimal,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
    }): UserWalletTotalStats {
        return new UserWalletTotalStats(
            params.userId,
            params.currency,
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Date(),
        );
    }

    static fromPersistence(data: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        totalDeposit: Prisma.Decimal;
        totalWithdraw: Prisma.Decimal;
        totalBet: Prisma.Decimal;
        totalWin: Prisma.Decimal;
        totalBonus: Prisma.Decimal;
        totalCompEarned: Prisma.Decimal;
        totalCompUsed: Prisma.Decimal;
        updatedAt: Date;
    }): UserWalletTotalStats {
        return new UserWalletTotalStats(
            data.userId,
            data.currency,
            data.totalDeposit,
            data.totalWithdraw,
            data.totalBet,
            data.totalWin,
            data.totalBonus,
            data.totalCompEarned,
            data.totalCompUsed,
            data.updatedAt,
        );
    }

    // Getters
    get totalDeposit(): Prisma.Decimal { return this._totalDeposit; }
    get totalWithdraw(): Prisma.Decimal { return this._totalWithdraw; }
    get totalBet(): Prisma.Decimal { return this._totalBet; }
    get totalWin(): Prisma.Decimal { return this._totalWin; }
    get totalBonus(): Prisma.Decimal { return this._totalBonus; }
    get totalCompEarned(): Prisma.Decimal { return this._totalCompEarned; }
    get totalCompUsed(): Prisma.Decimal { return this._totalCompUsed; }

    // Business Logic
    addDeposit(amount: Prisma.Decimal): void {
        this._totalDeposit = this._totalDeposit.add(amount);
    }

    addWithdraw(amount: Prisma.Decimal): void {
        this._totalWithdraw = this._totalWithdraw.add(amount);
    }

    addBet(amount: Prisma.Decimal): void {
        this._totalBet = this._totalBet.add(amount);
    }

    addWin(amount: Prisma.Decimal): void {
        this._totalWin = this._totalWin.add(amount);
    }

    addBonus(amount: Prisma.Decimal): void {
        this._totalBonus = this._totalBonus.add(amount);
    }

    addCompEarned(amount: Prisma.Decimal): void {
        this._totalCompEarned = this._totalCompEarned.add(amount);
    }

    addCompUsed(amount: Prisma.Decimal): void {
        this._totalCompUsed = this._totalCompUsed.add(amount);
    }

    /**
     * GGR (Gross Gaming Revenue) 계산
     * 공식: Bet - Win
     */
    get ggr(): Prisma.Decimal {
        return this._totalBet.sub(this._totalWin);
    }

    /**
     * NGR (Net Gaming Revenue) 계산
     * 공식: (Bet - Win) - Bonus
     * (플랫폼마다 정의가 다를 수 있으나 기본적인 산식)
     */
    get ngr(): Prisma.Decimal {
        return this.ggr.sub(this._totalBonus);
    }
}

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

        // Cash Flow
        private _totalDepositCash: Prisma.Decimal,
        private _totalWithdrawCash: Prisma.Decimal,

        // Bet/Win (Separated)
        private _totalBetCash: Prisma.Decimal,
        private _totalWinCash: Prisma.Decimal,
        private _totalBetBonus: Prisma.Decimal,
        private _totalWinBonus: Prisma.Decimal,

        // Bonus Flow
        private _totalBonusGiven: Prisma.Decimal,
        private _totalBonusUsed: Prisma.Decimal,

        // Comp Flow
        private _totalCompEarned: Prisma.Decimal,
        private _totalCompUsed: Prisma.Decimal,

        // Vault Flow
        private _totalVaultIn: Prisma.Decimal,
        private _totalVaultOut: Prisma.Decimal,

        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
    }): UserWalletTotalStats {
        return new UserWalletTotalStats(
            params.userId,
            params.currency,
            new Prisma.Decimal(0), // totalDepositCash
            new Prisma.Decimal(0), // totalWithdrawCash
            new Prisma.Decimal(0), // totalBetCash
            new Prisma.Decimal(0), // totalWinCash
            new Prisma.Decimal(0), // totalBetBonus
            new Prisma.Decimal(0), // totalWinBonus
            new Prisma.Decimal(0), // totalBonusGiven
            new Prisma.Decimal(0), // totalBonusUsed
            new Prisma.Decimal(0), // totalCompEarned
            new Prisma.Decimal(0), // totalCompUsed
            new Prisma.Decimal(0), // totalVaultIn
            new Prisma.Decimal(0), // totalVaultOut
            new Date(),
        );
    }

    static fromPersistence(data: {
        userId: bigint;
        currency: ExchangeCurrencyCode;
        totalDepositCash: Prisma.Decimal;
        totalWithdrawCash: Prisma.Decimal;
        totalBetCash: Prisma.Decimal;
        totalWinCash: Prisma.Decimal;
        totalBetBonus: Prisma.Decimal;
        totalWinBonus: Prisma.Decimal;
        totalBonusGiven: Prisma.Decimal;
        totalBonusUsed: Prisma.Decimal;
        totalCompEarned: Prisma.Decimal;
        totalCompUsed: Prisma.Decimal;
        totalVaultIn: Prisma.Decimal;
        totalVaultOut: Prisma.Decimal;
        updatedAt: Date;
    }): UserWalletTotalStats {
        return new UserWalletTotalStats(
            data.userId,
            data.currency,
            data.totalDepositCash,
            data.totalWithdrawCash,
            data.totalBetCash,
            data.totalWinCash,
            data.totalBetBonus,
            data.totalWinBonus,
            data.totalBonusGiven,
            data.totalBonusUsed,
            data.totalCompEarned,
            data.totalCompUsed,
            data.totalVaultIn,
            data.totalVaultOut,
            data.updatedAt,
        );
    }

    // Getters
    get totalDepositCash(): Prisma.Decimal { return this._totalDepositCash; }
    get totalWithdrawCash(): Prisma.Decimal { return this._totalWithdrawCash; }
    get totalBetCash(): Prisma.Decimal { return this._totalBetCash; }
    get totalWinCash(): Prisma.Decimal { return this._totalWinCash; }
    get totalBetBonus(): Prisma.Decimal { return this._totalBetBonus; }
    get totalWinBonus(): Prisma.Decimal { return this._totalWinBonus; }
    get totalBonusGiven(): Prisma.Decimal { return this._totalBonusGiven; }
    get totalBonusUsed(): Prisma.Decimal { return this._totalBonusUsed; }
    get totalCompEarned(): Prisma.Decimal { return this._totalCompEarned; }
    get totalCompUsed(): Prisma.Decimal { return this._totalCompUsed; }
    get totalVaultIn(): Prisma.Decimal { return this._totalVaultIn; }
    get totalVaultOut(): Prisma.Decimal { return this._totalVaultOut; }

    // Business Logic
    addDepositCash(amount: Prisma.Decimal): void {
        this._totalDepositCash = this._totalDepositCash.add(amount);
    }

    addWithdrawCash(amount: Prisma.Decimal): void {
        this._totalWithdrawCash = this._totalWithdrawCash.add(amount);
    }

    addBetCash(amount: Prisma.Decimal): void {
        this._totalBetCash = this._totalBetCash.add(amount);
    }

    addWinCash(amount: Prisma.Decimal): void {
        this._totalWinCash = this._totalWinCash.add(amount);
    }

    addBetBonus(amount: Prisma.Decimal): void {
        this._totalBetBonus = this._totalBetBonus.add(amount);
    }

    addWinBonus(amount: Prisma.Decimal): void {
        this._totalWinBonus = this._totalWinBonus.add(amount);
    }

    addBonusGiven(amount: Prisma.Decimal): void {
        this._totalBonusGiven = this._totalBonusGiven.add(amount);
    }

    addBonusUsed(amount: Prisma.Decimal): void {
        this._totalBonusUsed = this._totalBonusUsed.add(amount);
    }

    addCompEarned(amount: Prisma.Decimal): void {
        this._totalCompEarned = this._totalCompEarned.add(amount);
    }

    addCompUsed(amount: Prisma.Decimal): void {
        this._totalCompUsed = this._totalCompUsed.add(amount);
    }

    addVaultIn(amount: Prisma.Decimal): void {
        this._totalVaultIn = this._totalVaultIn.add(amount);
    }

    addVaultOut(amount: Prisma.Decimal): void {
        this._totalVaultOut = this._totalVaultOut.add(amount);
    }

    /**
     * Cash GGR (Gross Gaming Revenue)
     * Cash Bet - Cash Win
     */
    get cashGgr(): Prisma.Decimal {
        return this._totalBetCash.sub(this._totalWinCash);
    }

    /**
     * Bonus GGR
     * Bonus Bet - Bonus Win
     */
    get bonusGgr(): Prisma.Decimal {
        return this._totalBetBonus.sub(this._totalWinBonus);
    }

    /**
     * Total GGR
     */
    get totalGgr(): Prisma.Decimal {
        return this.cashGgr.add(this.bonusGgr);
    }

    /**
     * NGR (Net Gaming Revenue)
     * GGR - Bonus Costs
     * Note: This is a simplified formula. 
     * In some jurisdictions, NGR = (Cash Bet - Cash Win) - Bonus Cost - Taxes
     */
    get ngr(): Prisma.Decimal {
        return this.cashGgr.sub(this._totalBonusGiven); // Assuming Bonus Given is a cost
    }
}

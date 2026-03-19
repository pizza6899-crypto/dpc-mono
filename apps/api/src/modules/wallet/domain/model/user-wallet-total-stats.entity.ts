import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

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

    // Hall of Fame - 최고 기록
    private _maxBetAmount: Prisma.Decimal,
    private _maxWinAmount: Prisma.Decimal,

    // Count Statistics
    private _totalBetCount: bigint,
    private _totalWinCount: bigint,

    // Bonus Flow
    private _totalBonusGiven: Prisma.Decimal,
    private _totalBonusUsed: Prisma.Decimal,

    // Comp Flow
    private _totalCompEarned: Prisma.Decimal,
    private _totalCompUsed: Prisma.Decimal,

    // Vault Flow
    private _totalVaultIn: Prisma.Decimal,
    private _totalVaultOut: Prisma.Decimal,

    // Recency Statistics
    public lastBetAt: Date | null,
    public lastWinAt: Date | null,
    public lastDepositAt: Date | null,
    public lastWithdrawAt: Date | null,

    public readonly updatedAt: Date,
  ) {}

  static create(params: {
    userId: bigint;
    currency: ExchangeCurrencyCode;
  }): UserWalletTotalStats {
    return new UserWalletTotalStats(
      params.userId,
      params.currency,
      // Cash Flow
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      // Bet/Win
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      // Hall of Fame
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      // Count
      BigInt(0),
      BigInt(0),
      // Bonus
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      // Comp
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      // Vault
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      // Recency
      null,
      null,
      null,
      null,
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
    // Hall of Fame
    maxBetAmount: Prisma.Decimal;
    maxWinAmount: Prisma.Decimal;
    // Count
    totalBetCount: bigint;
    totalWinCount: bigint;
    // Bonus
    totalBonusGiven: Prisma.Decimal;
    totalBonusUsed: Prisma.Decimal;
    // Comp
    totalCompEarned: Prisma.Decimal;
    totalCompUsed: Prisma.Decimal;
    // Vault
    totalVaultIn: Prisma.Decimal;
    totalVaultOut: Prisma.Decimal;
    // Recency
    lastBetAt: Date | null;
    lastWinAt: Date | null;
    lastDepositAt: Date | null;
    lastWithdrawAt: Date | null;
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
      data.maxBetAmount,
      data.maxWinAmount,
      data.totalBetCount,
      data.totalWinCount,
      data.totalBonusGiven,
      data.totalBonusUsed,
      data.totalCompEarned,
      data.totalCompUsed,
      data.totalVaultIn,
      data.totalVaultOut,
      data.lastBetAt,
      data.lastWinAt,
      data.lastDepositAt,
      data.lastWithdrawAt,
      data.updatedAt,
    );
  }

  // Getters
  get totalDepositCash(): Prisma.Decimal {
    return this._totalDepositCash;
  }
  get totalWithdrawCash(): Prisma.Decimal {
    return this._totalWithdrawCash;
  }
  get totalBetCash(): Prisma.Decimal {
    return this._totalBetCash;
  }
  get totalWinCash(): Prisma.Decimal {
    return this._totalWinCash;
  }
  get totalBetBonus(): Prisma.Decimal {
    return this._totalBetBonus;
  }
  get totalWinBonus(): Prisma.Decimal {
    return this._totalWinBonus;
  }
  // Hall of Fame
  get maxBetAmount(): Prisma.Decimal {
    return this._maxBetAmount;
  }
  get maxWinAmount(): Prisma.Decimal {
    return this._maxWinAmount;
  }
  // Count
  get totalBetCount(): bigint {
    return this._totalBetCount;
  }
  get totalWinCount(): bigint {
    return this._totalWinCount;
  }
  // Bonus
  get totalBonusGiven(): Prisma.Decimal {
    return this._totalBonusGiven;
  }
  get totalBonusUsed(): Prisma.Decimal {
    return this._totalBonusUsed;
  }
  // Comp
  get totalCompEarned(): Prisma.Decimal {
    return this._totalCompEarned;
  }
  get totalCompUsed(): Prisma.Decimal {
    return this._totalCompUsed;
  }
  // Vault
  get totalVaultIn(): Prisma.Decimal {
    return this._totalVaultIn;
  }
  get totalVaultOut(): Prisma.Decimal {
    return this._totalVaultOut;
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

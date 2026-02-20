import type {
  GameProvider,
  GameAggregatorType,
  ExchangeCurrencyCode,
} from '@prisma/client';
import { Prisma } from '@prisma/client';
import { GameTransaction } from './game-transaction.entity';
import { CasinoErrorCode } from '../../constants/casino-error-codes';
import { CasinoGameRoundException } from '../casino.exception';

// 게임 결과 메타데이터 타입 정의
export type GameResultMetaUrl = { type: 'url'; value: string };
export type GameResultMetaText = { type: 'text'; value: string }; // JSON string or Plain text
export type GameResultMetaHtml = { type: 'html'; value: string }; // HTML content
export type GameResultMetaWhitecliffPush = {
  whitecliffPushInfo: {
    pushedAmount: number;
    tieAmount: number;
    processedAt: string;
  };
};
export type GameResultMeta =
  | GameResultMetaUrl
  | GameResultMetaText
  | GameResultMetaHtml
  | GameResultMetaWhitecliffPush;

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
    public readonly usdExchangeRate: Prisma.Decimal, // 추가됨
    public readonly compRate: Prisma.Decimal, // 추가됨

    // 통계 (합계)
    public totalBetAmount: Prisma.Decimal,
    public totalWinAmount: Prisma.Decimal,
    public totalGameBetAmount: Prisma.Decimal,
    public totalGameWinAmount: Prisma.Decimal,
    public totalRefundAmount: Prisma.Decimal, // 추가됨
    public totalGameRefundAmount: Prisma.Decimal, // 추가됨
    public totalJackpotAmount: Prisma.Decimal, // 추가됨
    public totalGameJackpotAmount: Prisma.Decimal, // 추가됨
    public jackpotContributionAmount: Prisma.Decimal, // 추가됨
    public compEarned: Prisma.Decimal, // 추가됨
    public resultMeta: GameResultMeta | null, // 추가됨 (GameResultMeta) (Strict Type)

    // 상태 및 시간
    public readonly startedAt: Date,
    public completedAt: Date | null,
    public isCompleted: boolean,
    public readonly isOrphaned: boolean,
    public pushedBetCheckedAt: Date | null, // 추가됨

    // 관계 (Optional)
    public readonly transactions?: GameTransaction[],
  ) {}

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
    usdExchangeRate: Prisma.Decimal,
    compRate: Prisma.Decimal,
    startedAt: Date,
    isOrphaned: boolean = false,
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
      usdExchangeRate,
      compRate,
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      null,
      startedAt,
      null,
      false,
      isOrphaned,
      null, // pushedBetCheckedAt
      undefined, // transactions (create 시점에는 트랜잭션 없음)
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
      data.usdExchangeRate,
      data.compRate,
      data.totalBetAmount,
      data.totalWinAmount,
      data.totalGameBetAmount,
      data.totalGameWinAmount,
      data.totalRefundAmount || new Prisma.Decimal(0),
      data.totalGameRefundAmount || new Prisma.Decimal(0),
      data.totalJackpotAmount || new Prisma.Decimal(0),
      data.totalGameJackpotAmount || new Prisma.Decimal(0),
      data.jackpotContributionAmount,
      data.compEarned,
      data.resultMeta,
      data.startedAt,
      data.completedAt,
      data.isCompleted,
      data.isOrphaned || false,
      data.pushedBetCheckedAt || null, // fromPersistence
      data.transactions?.map((tx: any) => GameTransaction.fromPersistence(tx)),
    );
  }

  public complete(): void {
    if (this.isCompleted) return;

    this.completedAt = new Date();
    this.isCompleted = true;
  }

  public addBet(
    amount: Prisma.Decimal,
    gameAmount: Prisma.Decimal | null,
  ): void {
    if (this.isCompleted) {
      throw new CasinoGameRoundException(
        CasinoErrorCode.ROUND_ALREADY_COMPLETED,
        `Cannot add bet to a completed round: ${this.id}`,
      );
    }
    if (amount.isNegative()) {
      throw new CasinoGameRoundException(
        CasinoErrorCode.INVALID_AMOUNT,
        `Bet amount cannot be negative: ${amount.toString()}`,
      );
    }

    this.totalBetAmount = this.totalBetAmount.add(amount);
    if (gameAmount) {
      this.totalGameBetAmount = this.totalGameBetAmount.add(gameAmount);
    }
  }

  public addWin(
    amount: Prisma.Decimal,
    gameAmount: Prisma.Decimal | null,
  ): void {
    if (amount.isNegative()) {
      throw new CasinoGameRoundException(
        CasinoErrorCode.INVALID_AMOUNT,
        `Win amount cannot be negative: ${amount.toString()}`,
      );
    }

    this.totalWinAmount = this.totalWinAmount.add(amount);
    if (gameAmount) {
      this.totalGameWinAmount = this.totalGameWinAmount.add(gameAmount);
    }
  }

  public addRefund(
    amount: Prisma.Decimal,
    gameAmount: Prisma.Decimal | null,
  ): void {
    if (amount.isNegative()) {
      throw new CasinoGameRoundException(
        CasinoErrorCode.INVALID_AMOUNT,
        `Refund amount cannot be negative: ${amount.toString()}`,
      );
    }
    this.totalRefundAmount = this.totalRefundAmount.add(amount);
    if (gameAmount) {
      this.totalGameRefundAmount = this.totalGameRefundAmount.add(gameAmount);
    }
  }

  public addJackpot(
    amount: Prisma.Decimal,
    gameAmount: Prisma.Decimal | null,
  ): void {
    if (amount.isNegative()) {
      throw new CasinoGameRoundException(
        CasinoErrorCode.INVALID_AMOUNT,
        `Jackpot amount cannot be negative: ${amount.toString()}`,
      );
    }
    this.totalJackpotAmount = this.totalJackpotAmount.add(amount);
    if (gameAmount) {
      this.totalGameJackpotAmount = this.totalGameJackpotAmount.add(gameAmount);
    }
  }

  public addComp(amount: Prisma.Decimal): void {
    if (amount.isNegative()) {
      throw new CasinoGameRoundException(
        CasinoErrorCode.INVALID_AMOUNT,
        `Comp amount cannot be negative: ${amount.toString()}`,
      );
    }
    this.compEarned = this.compEarned.add(amount);
  }

  public addJackpotContribution(amount: Prisma.Decimal): void {
    if (amount.isNegative()) {
      throw new CasinoGameRoundException(
        CasinoErrorCode.INVALID_AMOUNT,
        `Jackpot contribution amount cannot be negative: ${amount.toString()}`,
      );
    }
    this.jackpotContributionAmount = this.jackpotContributionAmount.add(amount);
  }
}

// src/modules/casino-refactor/domain/model/game-round.entity.ts
import type {
  GameAggregatorType,
  GameProvider,
  GameReplayType,
} from '@repo/database';
import { Prisma } from '@repo/database';

/**
 * GameRound 도메인 엔티티
 *
 * 게임 라운드를 표현하는 도메인 엔티티입니다.
 * 하나의 라운드에 여러 베팅과 당첨이 포함될 수 있으며,
 * 게임 통화와 지갑 통화로 금액을 집계합니다.
 */
export class GameRound {
  private constructor(
    public readonly id: bigint | null,
    public readonly uid: string | null,
    public readonly userId: bigint,
    public readonly aggregatorType: GameAggregatorType,
    public readonly provider: GameProvider,
    public readonly aggregatorTxId: string,
    public readonly aggregatorGameId: number,
    public readonly gameSessionId: bigint,
    public readonly transactionId: bigint | null,
    public readonly gameId: number | null,
    private _totalBetAmountInGameCurrency: Prisma.Decimal,
    private _totalWinAmountInGameCurrency: Prisma.Decimal | null,
    private _netAmountInGameCurrency: Prisma.Decimal,
    private _totalBetAmountInWalletCurrency: Prisma.Decimal,
    private _totalWinAmountInWalletCurrency: Prisma.Decimal | null,
    private _netAmountInWalletCurrency: Prisma.Decimal,
    private _jackpotContributionAmount: Prisma.Decimal,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly sessionId: string | null,
    public readonly tableId: string | null,
    public readonly roundId: string | null,
    public readonly replayType: GameReplayType | null,
    public readonly replayData: string | null,
    public readonly totalPushAmount: Prisma.Decimal | null,
    public readonly tieBetAmount: Prisma.Decimal | null,
    public readonly contributionAmount: Prisma.Decimal | null,
    public readonly compEarned: Prisma.Decimal | null,
  ) {
    // 비즈니스 규칙: 금액은 음수가 될 수 없음 (netAmount는 제외)
    if (this._totalBetAmountInGameCurrency.lt(0)) {
      throw new Error('Total bet amount cannot be negative');
    }
    if (this._totalBetAmountInWalletCurrency.lt(0)) {
      throw new Error('Total bet amount in wallet currency cannot be negative');
    }
    if (this._jackpotContributionAmount.lt(0)) {
      throw new Error('Jackpot contribution amount cannot be negative');
    }
  }

  /**
   * 새로운 게임 라운드 생성
   * @param params - 게임 라운드 생성 파라미터
   * @returns 생성된 게임 라운드 엔티티
   */
  static create(params: {
    userId: bigint;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    aggregatorTxId: string;
    aggregatorGameId: number;
    gameSessionId: bigint;
    gameId?: number;
    totalBetAmountInGameCurrency: Prisma.Decimal;
    totalBetAmountInWalletCurrency: Prisma.Decimal;
    jackpotContributionAmount?: Prisma.Decimal;
    startedAt?: Date;
    sessionId?: string;
    tableId?: string;
    roundId?: string;
  }): GameRound {
    const jackpotContributionAmount =
      params.jackpotContributionAmount ?? new Prisma.Decimal(0);
    const netAmountInGameCurrency = params.totalBetAmountInGameCurrency.neg();
    const netAmountInWalletCurrency =
      params.totalBetAmountInWalletCurrency.neg();

    return new GameRound(
      null, // id는 DB 저장 시 자동 생성
      null, // uid는 DB 저장 시 자동 생성
      params.userId,
      params.aggregatorType,
      params.provider,
      params.aggregatorTxId,
      params.aggregatorGameId,
      params.gameSessionId,
      null, // transactionId는 나중에 설정
      params.gameId ?? null,
      params.totalBetAmountInGameCurrency,
      null, // totalWinAmountInGameCurrency는 나중에 설정
      netAmountInGameCurrency,
      params.totalBetAmountInWalletCurrency,
      null, // totalWinAmountInWalletCurrency는 나중에 설정
      netAmountInWalletCurrency,
      jackpotContributionAmount,
      params.startedAt ?? new Date(),
      null, // completedAt는 라운드 완료 시 설정
      params.sessionId ?? null,
      params.tableId ?? null,
      params.roundId ?? null,
      null, // replayType
      null, // replayData
      null, // totalPushAmount
      null, // tieBetAmount
      null, // contributionAmount
      null, // compEarned
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    userId: bigint;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    aggregatorTxId: string;
    aggregatorGameId: number;
    gameSessionId: bigint;
    transactionId: bigint;
    gameId: number | null;
    totalBetAmountInGameCurrency: Prisma.Decimal | null;
    totalWinAmountInGameCurrency: Prisma.Decimal | null;
    netAmountInGameCurrency: Prisma.Decimal | null;
    totalBetAmountInWalletCurrency: Prisma.Decimal | null;
    totalWinAmountInWalletCurrency: Prisma.Decimal | null;
    netAmountInWalletCurrency: Prisma.Decimal | null;
    jackpotContributionAmount: Prisma.Decimal;
    startedAt: Date | null;
    completedAt: Date | null;
    sessionId: string | null;
    tableId: string | null;
    roundId: string | null;
    replayType: GameReplayType | null;
    replayData: string | null;
    totalPushAmount: Prisma.Decimal | null;
    tieBetAmount: Prisma.Decimal | null;
    contributionAmount: Prisma.Decimal | null;
    compEarned: Prisma.Decimal | null;
  }): GameRound {
    return new GameRound(
      data.id,
      data.uid,
      data.userId,
      data.aggregatorType,
      data.provider,
      data.aggregatorTxId,
      data.aggregatorGameId,
      data.gameSessionId,
      data.transactionId,
      data.gameId,
      data.totalBetAmountInGameCurrency ?? new Prisma.Decimal(0),
      data.totalWinAmountInGameCurrency,
      data.netAmountInGameCurrency ?? new Prisma.Decimal(0),
      data.totalBetAmountInWalletCurrency ?? new Prisma.Decimal(0),
      data.totalWinAmountInWalletCurrency,
      data.netAmountInWalletCurrency ?? new Prisma.Decimal(0),
      data.jackpotContributionAmount,
      data.startedAt,
      data.completedAt,
      data.sessionId,
      data.tableId,
      data.roundId,
      data.replayType,
      data.replayData,
      data.totalPushAmount,
      data.tieBetAmount,
      data.contributionAmount,
      data.compEarned,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    userId: bigint;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    aggregatorTxId: string;
    aggregatorGameId: number;
    gameSessionId: bigint;
    transactionId: bigint | null;
    gameId: number | null;
    totalBetAmountInGameCurrency: Prisma.Decimal;
    totalWinAmountInGameCurrency: Prisma.Decimal | null;
    netAmountInGameCurrency: Prisma.Decimal;
    totalBetAmountInWalletCurrency: Prisma.Decimal;
    totalWinAmountInWalletCurrency: Prisma.Decimal | null;
    netAmountInWalletCurrency: Prisma.Decimal;
    jackpotContributionAmount: Prisma.Decimal;
    startedAt: Date | null;
    completedAt: Date | null;
    sessionId: string | null;
    tableId: string | null;
    roundId: string | null;
    replayType: GameReplayType | null;
    replayData: string | null;
    totalPushAmount: Prisma.Decimal | null;
    tieBetAmount: Prisma.Decimal | null;
    contributionAmount: Prisma.Decimal | null;
    compEarned: Prisma.Decimal | null;
  } {
    return {
      userId: this.userId,
      aggregatorType: this.aggregatorType,
      provider: this.provider,
      aggregatorTxId: this.aggregatorTxId,
      aggregatorGameId: this.aggregatorGameId,
      gameSessionId: this.gameSessionId,
      transactionId: this.transactionId,
      gameId: this.gameId,
      totalBetAmountInGameCurrency: this._totalBetAmountInGameCurrency,
      totalWinAmountInGameCurrency: this._totalWinAmountInGameCurrency,
      netAmountInGameCurrency: this._netAmountInGameCurrency,
      totalBetAmountInWalletCurrency: this._totalBetAmountInWalletCurrency,
      totalWinAmountInWalletCurrency: this._totalWinAmountInWalletCurrency,
      netAmountInWalletCurrency: this._netAmountInWalletCurrency,
      jackpotContributionAmount: this._jackpotContributionAmount,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      sessionId: this.sessionId,
      tableId: this.tableId,
      roundId: this.roundId,
      replayType: this.replayType,
      replayData: this.replayData,
      totalPushAmount: this.totalPushAmount,
      tieBetAmount: this.tieBetAmount,
      contributionAmount: this.contributionAmount,
      compEarned: this.compEarned,
    };
  }

  /**
   * 베팅 금액 추가
   */
  addBet(
    betAmountInGameCurrency: Prisma.Decimal,
    betAmountInWalletCurrency: Prisma.Decimal,
    jackpotContributionAmount: Prisma.Decimal,
  ): void {
    this._totalBetAmountInGameCurrency =
      this._totalBetAmountInGameCurrency.add(betAmountInGameCurrency);
    this._totalBetAmountInWalletCurrency =
      this._totalBetAmountInWalletCurrency.add(betAmountInWalletCurrency);
    this._netAmountInGameCurrency =
      this._netAmountInGameCurrency.sub(betAmountInGameCurrency);
    this._netAmountInWalletCurrency =
      this._netAmountInWalletCurrency.sub(betAmountInWalletCurrency);
    this._jackpotContributionAmount =
      this._jackpotContributionAmount.add(jackpotContributionAmount);
  }

  /**
   * 당첨 금액 추가
   */
  addWin(
    winAmountInGameCurrency: Prisma.Decimal,
    winAmountInWalletCurrency: Prisma.Decimal,
  ): void {
    const currentTotalWinInGameCurrency =
      this._totalWinAmountInGameCurrency ?? new Prisma.Decimal(0);
    const currentTotalWinInWalletCurrency =
      this._totalWinAmountInWalletCurrency ?? new Prisma.Decimal(0);

    this._totalWinAmountInGameCurrency =
      currentTotalWinInGameCurrency.add(winAmountInGameCurrency);
    this._totalWinAmountInWalletCurrency =
      currentTotalWinInWalletCurrency.add(winAmountInWalletCurrency);
    this._netAmountInGameCurrency =
      this._netAmountInGameCurrency.add(winAmountInGameCurrency);
    this._netAmountInWalletCurrency =
      this._netAmountInWalletCurrency.add(winAmountInWalletCurrency);
  }

  /**
   * 라운드 완료 처리
   */
  complete(completedAt: Date): void {
    // completedAt은 readonly이므로 새로운 인스턴스를 반환해야 하지만,
    // 현재는 불변성을 완전히 보장하지 않으므로 직접 설정
    // 추후 불변성 보장이 필요하면 새로운 인스턴스를 반환하는 방식으로 변경
    (this as any).completedAt = completedAt;
  }

  /**
   * 트랜잭션 ID 설정
   */
  setTransactionId(transactionId: bigint): void {
    (this as any).transactionId = transactionId;
  }

  // Getters
  get totalBetAmountInGameCurrency(): Prisma.Decimal {
    return this._totalBetAmountInGameCurrency;
  }

  get totalWinAmountInGameCurrency(): Prisma.Decimal | null {
    return this._totalWinAmountInGameCurrency;
  }

  get netAmountInGameCurrency(): Prisma.Decimal {
    return this._netAmountInGameCurrency;
  }

  get totalBetAmountInWalletCurrency(): Prisma.Decimal {
    return this._totalBetAmountInWalletCurrency;
  }

  get totalWinAmountInWalletCurrency(): Prisma.Decimal | null {
    return this._totalWinAmountInWalletCurrency;
  }

  get netAmountInWalletCurrency(): Prisma.Decimal {
    return this._netAmountInWalletCurrency;
  }

  get jackpotContributionAmount(): Prisma.Decimal {
    return this._jackpotContributionAmount;
  }
}


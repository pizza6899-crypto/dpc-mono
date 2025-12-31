// src/modules/casino-refactor/domain/model/game-bet.entity.ts
import type { GameAggregatorType, BetType } from '@repo/database';
import { Prisma } from '@repo/database';

/**
 * GameBet 도메인 엔티티
 *
 * 개별 베팅을 표현하는 도메인 엔티티입니다.
 * 하나의 게임 라운드에 여러 베팅이 포함될 수 있습니다.
 */
export class GameBet {
  private constructor(
    public readonly id: bigint | null,
    public readonly uid: string | null,
    public readonly userId: bigint,
    public readonly gameRoundId: bigint,
    public readonly aggregatorType: GameAggregatorType,
    public readonly aggregatorBetId: string,
    public readonly betType: BetType,
    private _betAmount: Prisma.Decimal,
    private _betAmountInGameCurrency: Prisma.Decimal,
    public readonly bettedAt: Date,
    private _isCancelled: boolean,
    private _cancelledAt: Date | null,
    public readonly createdAt: Date,
  ) {
    // 비즈니스 규칙: 베팅 금액은 양수여야 함
    if (this._betAmount.lte(0)) {
      throw new Error('Bet amount must be positive');
    }
    if (this._betAmountInGameCurrency.lte(0)) {
      throw new Error('Bet amount in game currency must be positive');
    }
  }

  /**
   * 새로운 베팅 생성
   * @param params - 베팅 생성 파라미터
   * @returns 생성된 베팅 엔티티
   */
  static create(params: {
    userId: bigint;
    gameRoundId: bigint;
    aggregatorType: GameAggregatorType;
    aggregatorBetId: string;
    betType: BetType;
    betAmount: Prisma.Decimal;
    betAmountInGameCurrency: Prisma.Decimal;
    bettedAt: Date;
  }): GameBet {
    const now = new Date();
    return new GameBet(
      null, // id는 DB 저장 시 자동 생성
      null, // uid는 DB 저장 시 자동 생성
      params.userId,
      params.gameRoundId,
      params.aggregatorType,
      params.aggregatorBetId,
      params.betType,
      params.betAmount,
      params.betAmountInGameCurrency,
      params.bettedAt,
      false, // isCancelled
      null, // cancelledAt
      now,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    userId: bigint;
    gameRoundId: bigint;
    aggregatorType: GameAggregatorType;
    aggregatorBetId: string;
    betType: BetType;
    betAmount: Prisma.Decimal;
    betAmountInGameCurrency: Prisma.Decimal;
    bettedAt: Date;
    isCancelled: boolean;
    cancelledAt: Date | null;
    createdAt: Date;
  }): GameBet {
    return new GameBet(
      data.id,
      data.uid,
      data.userId,
      data.gameRoundId,
      data.aggregatorType,
      data.aggregatorBetId,
      data.betType,
      data.betAmount,
      data.betAmountInGameCurrency,
      data.bettedAt,
      data.isCancelled,
      data.cancelledAt,
      data.createdAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    userId: bigint;
    gameRoundId: bigint;
    aggregatorType: GameAggregatorType;
    aggregatorBetId: string;
    betType: BetType;
    betAmount: Prisma.Decimal;
    betAmountInGameCurrency: Prisma.Decimal;
    bettedAt: Date;
    isCancelled: boolean;
    cancelledAt: Date | null;
    createdAt: Date;
  } {
    return {
      userId: this.userId,
      gameRoundId: this.gameRoundId,
      aggregatorType: this.aggregatorType,
      aggregatorBetId: this.aggregatorBetId,
      betType: this.betType,
      betAmount: this._betAmount,
      betAmountInGameCurrency: this._betAmountInGameCurrency,
      bettedAt: this.bettedAt,
      isCancelled: this._isCancelled,
      cancelledAt: this._cancelledAt,
      createdAt: this.createdAt,
    };
  }

  /**
   * 베팅 취소 처리
   */
  cancel(cancelledAt: Date): void {
    if (this._isCancelled) {
      throw new Error('Bet is already cancelled');
    }
    (this as any)._isCancelled = true;
    (this as any)._cancelledAt = cancelledAt;
  }

  // Getters
  get betAmount(): Prisma.Decimal {
    return this._betAmount;
  }

  get betAmountInGameCurrency(): Prisma.Decimal {
    return this._betAmountInGameCurrency;
  }

  get isCancelled(): boolean {
    return this._isCancelled;
  }

  get cancelledAt(): Date | null {
    return this._cancelledAt;
  }
}


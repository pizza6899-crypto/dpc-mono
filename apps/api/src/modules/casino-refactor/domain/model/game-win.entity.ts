// src/modules/casino-refactor/domain/model/game-win.entity.ts
import type { GameAggregatorType, WinType } from '@repo/database';
import { Prisma } from '@repo/database';

/**
 * GameWin 도메인 엔티티
 *
 * 개별 당첨을 표현하는 도메인 엔티티입니다.
 * 하나의 게임 라운드에 여러 당첨이 포함될 수 있습니다.
 */
export class GameWin {
  private constructor(
    public readonly id: bigint | null,
    public readonly uid: string | null,
    public readonly userId: bigint,
    public readonly gameRoundId: bigint,
    public readonly aggregatorType: GameAggregatorType,
    public readonly aggregatorWinId: string,
    public readonly winType: WinType,
    private _winAmount: Prisma.Decimal,
    private _winAmountInGameCurrency: Prisma.Decimal,
    public readonly wonAt: Date,
    public readonly description: string | null,
    public readonly createdAt: Date,
  ) {
    // 비즈니스 규칙: 당첨 금액은 0 이상이어야 함
    if (this._winAmount.lt(0)) {
      throw new Error('Win amount cannot be negative');
    }
    if (this._winAmountInGameCurrency.lt(0)) {
      throw new Error('Win amount in game currency cannot be negative');
    }
  }

  /**
   * 새로운 당첨 생성
   * @param params - 당첨 생성 파라미터
   * @returns 생성된 당첨 엔티티
   */
  static create(params: {
    userId: bigint;
    gameRoundId: bigint;
    aggregatorType: GameAggregatorType;
    aggregatorWinId: string;
    winType: WinType;
    winAmount: Prisma.Decimal;
    winAmountInGameCurrency: Prisma.Decimal;
    wonAt: Date;
    description?: string;
  }): GameWin {
    const now = new Date();
    return new GameWin(
      null, // id는 DB 저장 시 자동 생성
      null, // uid는 DB 저장 시 자동 생성
      params.userId,
      params.gameRoundId,
      params.aggregatorType,
      params.aggregatorWinId,
      params.winType,
      params.winAmount,
      params.winAmountInGameCurrency,
      params.wonAt,
      params.description ?? null,
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
    aggregatorWinId: string;
    winType: WinType;
    winAmount: Prisma.Decimal;
    winAmountInGameCurrency: Prisma.Decimal;
    wonAt: Date;
    description: string | null;
    createdAt: Date;
  }): GameWin {
    return new GameWin(
      data.id,
      data.uid,
      data.userId,
      data.gameRoundId,
      data.aggregatorType,
      data.aggregatorWinId,
      data.winType,
      data.winAmount,
      data.winAmountInGameCurrency,
      data.wonAt,
      data.description,
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
    aggregatorWinId: string;
    winType: WinType;
    winAmount: Prisma.Decimal;
    winAmountInGameCurrency: Prisma.Decimal;
    wonAt: Date;
    description: string | null;
    createdAt: Date;
  } {
    return {
      userId: this.userId,
      gameRoundId: this.gameRoundId,
      aggregatorType: this.aggregatorType,
      aggregatorWinId: this.aggregatorWinId,
      winType: this.winType,
      winAmount: this._winAmount,
      winAmountInGameCurrency: this._winAmountInGameCurrency,
      wonAt: this.wonAt,
      description: this.description,
      createdAt: this.createdAt,
    };
  }

  // Getters
  get winAmount(): Prisma.Decimal {
    return this._winAmount;
  }

  get winAmountInGameCurrency(): Prisma.Decimal {
    return this._winAmountInGameCurrency;
  }
}


// src/modules/casino-refactor/domain/model/game-session.entity.ts
import type {
  GameAggregatorType,
  ExchangeCurrencyCode,
} from '@repo/database';
import { Prisma } from '@repo/database';

/**
 * GameSession 도메인 엔티티
 *
 * 게임 세션을 표현하는 도메인 엔티티입니다.
 * 게임 실행 시 환율을 고정하여 세션 동안 일관된 환율을 유지합니다.
 */
export class GameSession {
  private constructor(
    public readonly id: bigint | null,
    public readonly uid: string | null,
    public readonly userId: bigint,
    public readonly aggregatorType: GameAggregatorType,
    public readonly token: string,
    public readonly walletCurrency: ExchangeCurrencyCode,
    public readonly gameCurrency: ExchangeCurrencyCode,
    public readonly exchangeRate: Prisma.Decimal,
    public readonly exchangeRateSnapshotAt: Date,
    public readonly gameId: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastAccessedAt: Date,
  ) {
    // 비즈니스 규칙: 환율은 양수여야 함
    if (this.exchangeRate.lte(0)) {
      throw new Error('Exchange rate must be positive');
    }
  }

  /**
   * 새로운 게임 세션 생성
   * @param params - 게임 세션 생성 파라미터
   * @returns 생성된 게임 세션 엔티티
   */
  static create(params: {
    userId: bigint;
    aggregatorType: GameAggregatorType;
    token: string;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    exchangeRate: Prisma.Decimal;
    gameId?: number;
  }): GameSession {
    const now = new Date();
    return new GameSession(
      null, // id는 DB 저장 시 자동 생성
      null, // uid는 DB 저장 시 자동 생성
      params.userId,
      params.aggregatorType,
      params.token,
      params.walletCurrency,
      params.gameCurrency,
      params.exchangeRate,
      now, // exchangeRateSnapshotAt
      params.gameId ?? null,
      now,
      now,
      now,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   */
  static fromPersistence(data: {
    id: bigint;
    uid: string;
    userId: bigint;
    aggregatorType: GameAggregatorType;
    token: string;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    exchangeRate: Prisma.Decimal;
    exchangeRateSnapshotAt: Date;
    gameId: number | null;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date;
  }): GameSession {
    return new GameSession(
      data.id,
      data.uid,
      data.userId,
      data.aggregatorType,
      data.token,
      data.walletCurrency,
      data.gameCurrency,
      data.exchangeRate,
      data.exchangeRateSnapshotAt,
      data.gameId,
      data.createdAt,
      data.updatedAt,
      data.lastAccessedAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    userId: bigint;
    aggregatorType: GameAggregatorType;
    token: string;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    exchangeRate: Prisma.Decimal;
    exchangeRateSnapshotAt: Date;
    gameId: number | null;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt: Date;
  } {
    return {
      userId: this.userId,
      aggregatorType: this.aggregatorType,
      token: this.token,
      walletCurrency: this.walletCurrency,
      gameCurrency: this.gameCurrency,
      exchangeRate: this.exchangeRate,
      exchangeRateSnapshotAt: this.exchangeRateSnapshotAt,
      gameId: this.gameId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastAccessedAt: this.lastAccessedAt,
    };
  }
}


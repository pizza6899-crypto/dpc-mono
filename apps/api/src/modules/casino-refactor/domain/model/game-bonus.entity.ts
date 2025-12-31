// src/modules/casino-refactor/domain/model/game-bonus.entity.ts
import type {
  GameAggregatorType,
  GameProvider,
  BonusType,
} from '@repo/database';
import { Prisma } from '@repo/database';

/**
 * GameBonus 도메인 엔티티
 *
 * 게임 보너스를 표현하는 도메인 엔티티입니다.
 * 보너스는 게임 라운드와 독립적으로 지급될 수 있으며,
 * 프로모션, 게임 내 보너스, 프리스핀 등 다양한 소스에서 발생할 수 있습니다.
 */
export class GameBonus {
  private constructor(
    public readonly id: bigint | null,
    public readonly uid: string | null,
    public readonly userId: bigint,
    public readonly transactionId: bigint | null,
    public readonly aggregatorType: GameAggregatorType,
    public readonly provider: GameProvider,
    public readonly bonusType: BonusType,
    private _amount: Prisma.Decimal,
    public readonly transactionTime: Date,
    public readonly gameId: number | null,
    public readonly aggregatorPromotionId: string | null,
    public readonly aggregatorRoundId: string | null,
    public readonly aggregatorWagerId: string | null,
    public readonly aggregatorTransactionId: string | null,
    public readonly aggregatorFreespinId: string | null,
    public readonly aggregatorSessionId: string | null,
    public readonly isEndRound: boolean | null,
    public readonly description: string | null,
    public readonly createdAt: Date,
  ) {
    // 비즈니스 규칙: 보너스 금액은 양수여야 함
    if (this._amount.lte(0)) {
      throw new Error('Bonus amount must be positive');
    }
  }

  /**
   * 새로운 보너스 생성
   * @param params - 보너스 생성 파라미터
   * @returns 생성된 보너스 엔티티
   */
  static create(params: {
    userId: bigint;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    bonusType: BonusType;
    amount: Prisma.Decimal;
    transactionTime: Date;
    gameId?: number;
    aggregatorPromotionId?: string;
    aggregatorRoundId?: string;
    aggregatorWagerId?: string;
    aggregatorTransactionId?: string;
    aggregatorFreespinId?: string;
    aggregatorSessionId?: string;
    isEndRound?: boolean;
    description?: string;
  }): GameBonus {
    const now = new Date();
    return new GameBonus(
      null, // id는 DB 저장 시 자동 생성
      null, // uid는 DB 저장 시 자동 생성
      params.userId,
      null, // transactionId는 나중에 설정
      params.aggregatorType,
      params.provider,
      params.bonusType,
      params.amount,
      params.transactionTime,
      params.gameId ?? null,
      params.aggregatorPromotionId ?? null,
      params.aggregatorRoundId ?? null,
      params.aggregatorWagerId ?? null,
      params.aggregatorTransactionId ?? null,
      params.aggregatorFreespinId ?? null,
      params.aggregatorSessionId ?? null,
      params.isEndRound ?? null,
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
    transactionId: bigint;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    bonusType: BonusType;
    amount: Prisma.Decimal;
    transactionTime: Date;
    gameId: number | null;
    aggregatorPromotionId: string | null;
    aggregatorRoundId: string | null;
    aggregatorWagerId: string | null;
    aggregatorTransactionId: string | null;
    aggregatorFreespinId: string | null;
    aggregatorSessionId: string | null;
    isEndRound: boolean | null;
    description: string | null;
    createdAt: Date;
  }): GameBonus {
    return new GameBonus(
      data.id,
      data.uid,
      data.userId,
      data.transactionId,
      data.aggregatorType,
      data.provider,
      data.bonusType,
      data.amount,
      data.transactionTime,
      data.gameId,
      data.aggregatorPromotionId,
      data.aggregatorRoundId,
      data.aggregatorWagerId,
      data.aggregatorTransactionId,
      data.aggregatorFreespinId,
      data.aggregatorSessionId,
      data.isEndRound,
      data.description,
      data.createdAt,
    );
  }

  /**
   * Domain 엔티티를 Persistence 레이어로 변환
   */
  toPersistence(): {
    userId: bigint;
    transactionId: bigint | null;
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    bonusType: BonusType;
    amount: Prisma.Decimal;
    transactionTime: Date;
    gameId: number | null;
    aggregatorPromotionId: string | null;
    aggregatorRoundId: string | null;
    aggregatorWagerId: string | null;
    aggregatorTransactionId: string | null;
    aggregatorFreespinId: string | null;
    aggregatorSessionId: string | null;
    isEndRound: boolean | null;
    description: string | null;
    createdAt: Date;
  } {
    return {
      userId: this.userId,
      transactionId: this.transactionId,
      aggregatorType: this.aggregatorType,
      provider: this.provider,
      bonusType: this.bonusType,
      amount: this._amount,
      transactionTime: this.transactionTime,
      gameId: this.gameId,
      aggregatorPromotionId: this.aggregatorPromotionId,
      aggregatorRoundId: this.aggregatorRoundId,
      aggregatorWagerId: this.aggregatorWagerId,
      aggregatorTransactionId: this.aggregatorTransactionId,
      aggregatorFreespinId: this.aggregatorFreespinId,
      aggregatorSessionId: this.aggregatorSessionId,
      isEndRound: this.isEndRound,
      description: this.description,
      createdAt: this.createdAt,
    };
  }

  /**
   * 트랜잭션 ID 설정
   */
  setTransactionId(transactionId: bigint): void {
    (this as any).transactionId = transactionId;
  }

  /**
   * 중복 체크를 위한 고유 식별자 조합 생성
   * 여러 aggregator 식별자 조합으로 중복을 체크할 수 있음
   */
  getUniqueIdentifiers(): {
    aggregatorType: GameAggregatorType;
    provider: GameProvider;
    aggregatorPromotionId?: string;
    aggregatorRoundId?: string;
    aggregatorWagerId?: string;
    aggregatorTransactionId?: string;
    aggregatorFreespinId?: string;
  } {
    return {
      aggregatorType: this.aggregatorType,
      provider: this.provider,
      ...(this.aggregatorPromotionId && {
        aggregatorPromotionId: this.aggregatorPromotionId,
      }),
      ...(this.aggregatorRoundId && { aggregatorRoundId: this.aggregatorRoundId }),
      ...(this.aggregatorWagerId && { aggregatorWagerId: this.aggregatorWagerId }),
      ...(this.aggregatorTransactionId && {
        aggregatorTransactionId: this.aggregatorTransactionId,
      }),
      ...(this.aggregatorFreespinId && {
        aggregatorFreespinId: this.aggregatorFreespinId,
      }),
    };
  }

  // Getters
  get amount(): Prisma.Decimal {
    return this._amount;
  }
}


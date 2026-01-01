// src/modules/casino-refactor/aggregator/wc/domain/model/wc-transaction-request.value-object.ts
import { GamingCurrencyCode } from 'src/utils/currency.util';

/**
 * WC 트랜잭션 요청 값 객체
 *
 * Whitecliff API의 트랜잭션 요청을 표현하는 값 객체입니다.
 */
export class WcTransactionRequest {
  private constructor(
    public readonly gameCurrency: GamingCurrencyCode,
    public readonly productId: number,
    public readonly transactionId: string,
    public readonly roundId?: string,
    public readonly gameId?: number,
    public readonly tableId?: string,
  ) {
    // 비즈니스 규칙: 제품 ID는 양수여야 함
    if (this.productId <= 0) {
      throw new Error('Product ID must be positive');
    }
    // 비즈니스 규칙: 트랜잭션 ID는 비어있을 수 없음
    if (!this.transactionId || this.transactionId.trim().length === 0) {
      throw new Error('Transaction ID cannot be empty');
    }
  }

  /**
   * 새로운 트랜잭션 요청 생성
   */
  static create(params: {
    gameCurrency: GamingCurrencyCode;
    productId: number;
    transactionId: string;
    roundId?: string;
    gameId?: number;
    tableId?: string;
  }): WcTransactionRequest {
    return new WcTransactionRequest(
      params.gameCurrency,
      params.productId,
      params.transactionId,
      params.roundId,
      params.gameId,
      params.tableId,
    );
  }
}


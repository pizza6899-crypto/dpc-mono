// src/modules/casino-refactor/aggregator/wc/domain/model/wc-game-launch-request.value-object.ts
import { Language } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

/**
 * WC 게임 실행 요청 값 객체
 *
 * Whitecliff API의 게임 실행 요청을 표현하는 값 객체입니다.
 */
export class WcGameLaunchRequest {
  private constructor(
    public readonly userId: number,
    public readonly userName: string,
    public readonly balance: number,
    public readonly language: Language,
    public readonly gameCurrency: GamingCurrencyCode,
    public readonly token: string,
    public readonly productId: number,
    public readonly productType?: number,
    public readonly isMobile?: boolean,
    public readonly tableId?: string,
  ) {
    // 비즈니스 규칙: 사용자 ID는 양수여야 함
    if (this.userId <= 0) {
      throw new Error('User ID must be positive');
    }
    // 비즈니스 규칙: 잔액은 0 이상이어야 함
    if (this.balance < 0) {
      throw new Error('Balance cannot be negative');
    }
    // 비즈니스 규칙: 제품 ID는 양수여야 함
    if (this.productId <= 0) {
      throw new Error('Product ID must be positive');
    }
    // 비즈니스 규칙: 토큰은 비어있을 수 없음
    if (!this.token || this.token.trim().length === 0) {
      throw new Error('Token cannot be empty');
    }
  }

  /**
   * 새로운 게임 실행 요청 생성
   */
  static create(params: {
    userId: number;
    userName: string;
    balance: number;
    language: Language;
    gameCurrency: GamingCurrencyCode;
    token: string;
    productId: number;
    productType?: number;
    isMobile?: boolean;
    tableId?: string;
  }): WcGameLaunchRequest {
    return new WcGameLaunchRequest(
      params.userId,
      params.userName,
      params.balance,
      params.language,
      params.gameCurrency,
      params.token,
      params.productId,
      params.productType,
      params.isMobile,
      params.tableId,
    );
  }

  /**
   * Whitecliff API 요청 형식으로 변환
   */
  toApiRequest(config: {
    currency: string;
    redirectHomeUrl: string;
  }): {
    user: {
      id: number;
      name: string;
      balance: number;
      language: Language;
      sid: string;
      currency: string;
      home_url: string;
    };
    prd: {
      id: number;
      type: number;
      is_mobile: boolean;
      table_id: string;
    };
  } {
    return {
      user: {
        id: this.userId,
        name: this.userName,
        balance: this.balance,
        language: this.language || 'en',
        sid: this.token,
        currency: config.currency,
        home_url: config.redirectHomeUrl,
      },
      prd: {
        id: this.productId,
        type: this.productType || 0,
        is_mobile: this.isMobile || false,
        table_id: this.tableId || '',
      },
    };
  }
}


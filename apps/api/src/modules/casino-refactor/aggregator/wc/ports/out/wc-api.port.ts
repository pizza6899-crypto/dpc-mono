// src/modules/casino-refactor/aggregator/wc/ports/out/wc-api.port.ts
import type {
  WhitecliffGameLaunchResponse,
  TransactionResultsResponse,
  ProductGameListResponse,
  PushedBetHistoryResponse,
} from '../../infrastructure/wc-api.service';
import { GameProvider, Language } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

// 공통 에러 응답 타입 정의
export interface WhitecliffErrorResponse {
  status: number;
  error: string;
  message?: string;
}

// 베팅 결과 응답 타입
export interface BetResultsResponse {
  status: number;
  type: number;
  game_id: number;
  stake: number;
  payout: number;
  is_cancel: number;
  credit_time: string;
  error: string;
}

/**
 * WC API 포트 인터페이스
 *
 * Whitecliff API를 호출하는 포트입니다.
 * 외부 API와의 통신을 추상화합니다.
 */
export interface WcApiPort {
  /**
   * 게임 실행 (회원가입 겸용)
   */
  launchGame({
    user,
    prd,
  }: {
    user: {
      id: number;
      name: string;
      balance: number;
      language: Language;
      gameCurrency: GamingCurrencyCode;
      token: string;
    };
    prd: {
      id: number;
      type?: number;
      is_mobile?: boolean;
      table_id?: string;
    };
  }): Promise<WhitecliffGameLaunchResponse | WhitecliffErrorResponse>;

  /**
   * Bet Results 결과재확인
   * WHITECLIFF에서 특정 베팅 결과를 재확인하는 API를 호출합니다.
   */
  getBetResults(
    gameCurrency: GamingCurrencyCode,
    prdId: number,
    txnId: string,
  ): Promise<BetResultsResponse | WhitecliffErrorResponse>;

  /**
   * Transaction Results 베팅 정보 조회
   * WHITECLIFF에서 특정 베팅의 상세 정보를 조회하는 API를 호출합니다.
   */
  getTransactionResults({
    gameCurrency,
    lang,
    provider,
    txn_id,
  }: {
    gameCurrency: GamingCurrencyCode;
    lang: Language;
    provider: GameProvider;
    txn_id: string;
  }): Promise<TransactionResultsResponse | WhitecliffErrorResponse>;

  /**
   * Product(s) Game List - 게임리스트 조회
   * WHITECLIFF에서 서비스 중인 게임 목록을 조회합니다.
   */
  getProductGameList({
    gameCurrency,
    language,
    prd_id,
  }: {
    gameCurrency: GamingCurrencyCode;
    language: Language;
    prd_id?: number;
  }): Promise<ProductGameListResponse | WhitecliffErrorResponse>;

  /**
   * 푸시 베팅 내역 조회 (Pushed Bet History)
   * Evolution Live Casino - Baccarat 및 Blackjack 전용
   */
  getPushedBetHistory({
    gameCurrency,
    prd_id,
    start_date,
    end_date,
  }: {
    gameCurrency: GamingCurrencyCode;
    prd_id: number;
    start_date: string;
    end_date: string;
  }): Promise<PushedBetHistoryResponse | WhitecliffErrorResponse>;
}

// src/modules/casino-refactor/aggregator/wc/ports/out/wc-aggregator-api.port.ts
import { GameProvider, Language } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

export interface WhitecliffGameLaunchResponse {
  status: number;
  user_id: number;
  sid: string;
  launch_url: string;
}

export interface WhitecliffErrorResponse {
  status: number;
  error: string;
  message?: string;
}

export interface WhitecliffGameListResponse {
  status: number;
  game_list: {
    [prd_id: string]: {
      prd_name: string;
      prd_category: string;
      game_id: number;
      game_name: string;
      table_id?: string | null;
      game_type?: string | null;
      game_icon_link?: string | null;
      game_icon_link_sq?: string;
      is_enabled: number;
    }[];
  };
  error?: string;
}

/**
 * WC Aggregator API Port
 *
 * Whitecliff 애그리게이터와의 통신을 위한 포트 인터페이스입니다.
 * 필요한 메서드만 정의합니다.
 */
export interface WcAggregatorApiPort {
  /**
   * 게임 목록 조회
   * @param provider 게임 제공사
   * @returns 게임 목록 데이터
   */
  getGameList(params: { provider: GameProvider }): Promise<WhitecliffGameListResponse | WhitecliffErrorResponse>;

  /**
   * 게임 실행 (회원가입 겸용)
   * @param user 사용자 정보
   * @param prd 게임 상품 정보
   * @returns 게임 실행 응답 데이터
   */
  launchGame(params: {
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
}

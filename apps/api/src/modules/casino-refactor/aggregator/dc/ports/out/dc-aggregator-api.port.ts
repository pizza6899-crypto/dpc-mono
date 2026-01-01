// src/modules/casino-refactor/aggregator/dc/ports/out/dc-aggregator-api.port.ts

import { GameProvider } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';

/**
 * DC Aggregator API Port
 *
 * DC 애그리게이터와의 통신을 위한 포트 인터페이스입니다.
 * 필요한 메서드만 정의합니다.
 */
export interface DcAggregatorApiPort {
  /**
   * 게임 목록 조회
   * @param provider 게임 제공사
   * @returns 게임 목록 데이터
   */
  getGameList(params: { provider: GameProvider }): Promise<{
    code: number;
    msg: string;
    data: {
      provider: string;
      game_id: number;
      game_name: string;
      game_name_cn: string;
      release_date: string;
      rtp: string;
      game_icon: string;
      content_type: string;
      game_type: string;
      content: string;
    }[];
  }>;

  /**
   * 게임 로그인
   * @param dcsUserId DCS 사용자 ID
   * @param dcsUserToken DCS 사용자 토큰
   * @param gameId 게임 ID
   * @param gameCurrency 게임 통화
   * @param language 언어
   * @param channel 채널 (mobile/pc)
   * @param country_code 국가 코드
   * @param full_screen 전체 화면 여부
   * @returns 게임 로그인 응답 데이터
   */
  loginGame(params: {
    dcsUserId: string;
    dcsUserToken: string;
    gameId: number;
    gameCurrency: GamingCurrencyCode;
    language: string;
    channel: string;
    country_code: string;
    full_screen?: boolean;
  }): Promise<{
    code: number;
    msg: string;
    data: {
      game_url: string;
    };
  }>;
}

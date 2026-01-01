// src/modules/casino-refactor/aggregator/dc/ports/out/dc-aggregator-api.port.ts

import { GameProvider } from '@repo/database';

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
}

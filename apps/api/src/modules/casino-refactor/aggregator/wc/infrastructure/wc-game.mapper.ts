// src/modules/casino-refactor/aggregator/wc/infrastructure/wc-game.mapper.ts
import { Injectable } from '@nestjs/common';
import type { ProductGameListResponse } from './wc-api.service';
import { GameProvider, GameCategory, Language } from '@repo/database';
import { WhitecliffMapperService } from 'src/modules/casino/whitecliff/infrastructure/whitecliff-mapper.service';
import type { Game } from '../../../domain';

/**
 * WC 게임 매퍼
 *
 * Whitecliff API 응답을 도메인 엔티티로 변환합니다.
 */
@Injectable()
export class WcGameMapper {
  constructor(
    private readonly whitecliffMapperService: WhitecliffMapperService,
  ) {}

  /**
   * Whitecliff 게임 리스트 응답을 도메인 게임 데이터로 변환
   */
  toGameDataList(
    response: ProductGameListResponse,
    language: Language,
  ): Array<{
    aggregatorType: 'WHITECLIFF';
    provider: GameProvider;
    category: GameCategory;
    aggregatorGameId: number;
    gameType: string | null;
    tableId: string | null;
    iconLink: string | null;
    isEnabled: boolean;
    isVisibleToUser: boolean;
    translations: Array<{
      language: Language;
      providerName: string;
      categoryName: string;
      gameName: string;
    }>;
  }> {
    const gameDataList: Array<{
      aggregatorType: 'WHITECLIFF';
      provider: GameProvider;
      category: GameCategory;
      aggregatorGameId: number;
      gameType: string | null;
      tableId: string | null;
      iconLink: string | null;
      isEnabled: boolean;
      isVisibleToUser: boolean;
      translations: Array<{
        language: Language;
        providerName: string;
        categoryName: string;
        gameName: string;
      }>;
    }> = [];

    if (!response.game_list || response.status !== 1) {
      return gameDataList;
    }

    // game_list는 { [prd_id: string]: GameInfo[] } 형태
    for (const [prdId, games] of Object.entries(response.game_list)) {
      const provider = this.whitecliffMapperService.fromWhitecliffProvider(
        Number(prdId),
      );

      if (!provider) {
        // 알 수 없는 프로바이더는 스킵
        continue;
      }

      for (const game of games) {
        const category =
          this.whitecliffMapperService.fromWhitecliffCategory(
            game.prd_category,
          );

        if (!category) {
          // 알 수 없는 카테고리는 스킵
          continue;
        }

        gameDataList.push({
          aggregatorType: 'WHITECLIFF',
          provider,
          category,
          aggregatorGameId: game.game_id,
          gameType: game.game_type ?? null,
          tableId: game.table_id ?? null,
          iconLink: game.game_icon_link ?? game.game_icon_link_sq ?? null,
          isEnabled: game.is_enabled === 1,
          isVisibleToUser: game.is_enabled === 1, // 활성화된 게임만 사용자에게 노출
          translations: [
            {
              language,
              providerName: game.prd_name,
              categoryName: game.prd_category,
              gameName: game.game_name,
            },
          ],
        });
      }
    }

    return gameDataList;
  }
}


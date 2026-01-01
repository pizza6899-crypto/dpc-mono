// src/modules/casino-refactor/aggregator/wc/application/sync-games-from-wc.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WC_API_PORT } from '../ports/out/wc-api.token';
import type { WcApiPort } from '../ports/out/wc-api.port';
import { WcGameMapper } from '../infrastructure/wc-game.mapper';
import { WhitecliffMapperService } from 'src/modules/casino/whitecliff/infrastructure/whitecliff-mapper.service';
import { GameProvider, Language } from '@repo/database';
import { GamingCurrencyCode } from 'src/utils/currency.util';
import type { ProductGameListResponse } from '../infrastructure/wc-api.service';

interface SyncGamesFromWcParams {
  gameCurrency: GamingCurrencyCode;
  language: Language;
  provider?: GameProvider;
}

interface SyncGamesFromWcResult {
  total: number;
  gameDataList: Array<{
    aggregatorType: 'WHITECLIFF';
    provider: GameProvider;
    category: any;
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
  }>;
  errors: string[];
}

/**
 * WC에서 게임 리스트를 가져오는 Use Case
 *
 * Whitecliff API를 호출하여 게임 리스트를 가져오고,
 * 도메인 엔티티로 변환합니다.
 */
@Injectable()
export class SyncGamesFromWcService {
  private readonly logger = new Logger(SyncGamesFromWcService.name);

  constructor(
    @Inject(WC_API_PORT)
    private readonly wcApiPort: WcApiPort,
    private readonly wcGameMapper: WcGameMapper,
    private readonly whitecliffMapperService: WhitecliffMapperService,
  ) {}

  /**
   * WC에서 게임 리스트를 가져옵니다.
   */
  async execute(
    params: SyncGamesFromWcParams,
  ): Promise<SyncGamesFromWcResult> {
    this.logger.log(
      `WC 게임 리스트 가져오기 시작: gameCurrency=${params.gameCurrency}, language=${params.language}, provider=${params.provider}`,
    );

    const result: SyncGamesFromWcResult = {
      total: 0,
      gameDataList: [],
      errors: [],
    };

    try {
      // provider가 지정된 경우 해당 prd_id로 필터링
      let prd_id: number | undefined;
      if (params.provider) {
        prd_id =
          this.whitecliffMapperService.toWhitecliffProvider(
            params.provider,
          ) ?? undefined;
      }

      // WC API 호출
      const apiResponse = await this.wcApiPort.getProductGameList({
        gameCurrency: params.gameCurrency,
        language: params.language,
        prd_id,
      });

      // 에러 응답 체크
      if ('error' in apiResponse && apiResponse.status === 0) {
        const errorMessage =
          apiResponse.error || 'WC API 요청 실패';
        this.logger.error(`WC API 에러: ${errorMessage}`);
        result.errors.push(errorMessage);
        return result;
      }

      // 성공 응답인 경우
      if ('game_list' in apiResponse) {
        const gameDataList = this.wcGameMapper.toGameDataList(
          apiResponse as ProductGameListResponse,
          params.language,
        );

        result.total = gameDataList.length;
        result.gameDataList = gameDataList;

        this.logger.log(
          `WC 게임 리스트 가져오기 완료: 총 ${result.total}개 게임`,
        );
      } else {
        result.errors.push('예상치 못한 응답 형식');
      }
    } catch (error) {
      this.logger.error(error, 'WC 게임 리스트 가져오기 중 오류 발생');
      result.errors.push(error.message || 'Unknown error');
    }

    return result;
  }
}


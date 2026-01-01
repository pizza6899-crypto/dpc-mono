// src/modules/casino-refactor/application/sync-games-from-aggregator.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import { Game } from '../domain';
import {
  GameAggregatorType,
  GameProvider,
  GameCategory,
  Language,
} from '@repo/database';
import { generateUid } from 'src/utils/id.util';
import { DC_AGGREGATOR_API } from '../aggregator/dc/ports/out/dc-aggregator-api.token';
import type { DcAggregatorApiPort } from '../aggregator/dc/ports/out/dc-aggregator-api.port';
import { DcMapperService } from '../aggregator/dc/infrastructure/dc-mapper.service';

interface SyncGamesFromAggregatorParams {
  provider: GameProvider;
}

interface SyncGamesResult {
  total: number;
  created: number;
  updated: number;
  disabled: number;
  errors: string[];
}

/**
 * 게임 애그리게이터에서 게임 데이터를 동기화하는 Use Case
 *
 * 관리자가 명시적으로 호출하여 하위 게임 애그리게이터 API를 통해
 * 게임 데이터를 업데이트하거나 생성합니다.
 * (신규 게임, 서비스 종료 게임, 이미지 변경, 이름 변경, 다국어 등)
 */
@Injectable()
export class SyncGamesFromAggregatorService {
  private readonly logger = new Logger(SyncGamesFromAggregatorService.name);

  constructor(
    @Inject(GAME_REPOSITORY)
    private readonly repository: GameRepositoryPort,
    @Inject(DC_AGGREGATOR_API)
    private readonly dcAdapter: DcAggregatorApiPort,
    private readonly dcMapper: DcMapperService,
  ) {}

  async execute(
    params: SyncGamesFromAggregatorParams,
  ): Promise<SyncGamesResult> {
    this.logger.log(`게임 동기화 시작: provider=${params.provider}`);

    const result: SyncGamesResult = {
      total: 0,
      created: 0,
      updated: 0,
      disabled: 0,
      errors: [],
    };

    try {
      // 프로바이더에 따라 애그리게이터 결정
      const aggregatorType = this.getAggregatorTypeByProvider(params.provider);
      if (!aggregatorType) {
        result.errors.push(
          `Unsupported provider: ${params.provider}`,
        );
        return result;
      }

      // 애그리게이터 타입에 따라 분기
      let gameDataList: Array<{
        aggregatorType: GameAggregatorType;
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

      if (aggregatorType === GameAggregatorType.DCS) {
        // DC 어댑터 호출
        try {

          // DC API 호출
          const dcResponse = await this.dcAdapter.getGameList({
            provider: params.provider,
          });

          // DC 응답을 도메인 모델로 변환
          if (dcResponse.code === 1000 && dcResponse.data) {
            for (const dcGame of dcResponse.data) {
              const domainProvider = this.dcMapper.toDomainProvider(dcGame.provider);
              if (!domainProvider) {
                continue;
              }

              // 카테고리는 content_type이나 game_type에서 추론
              // DC API 응답에는 명시적인 category가 없으므로 기본값 사용
              const category = GameCategory.SLOTS; // 기본값, 필요시 매핑 로직 추가

              // 번역 정보 준비
              const translations: Array<{
                language: Language;
                providerName: string;
                categoryName: string;
                gameName: string;
              }> = [];

              // 영어 번역
              if (dcGame.game_name) {
                translations.push({
                  language: Language.EN,
                  providerName: dcGame.content || dcGame.provider,
                  categoryName: dcGame.content_type || 'Standard',
                  gameName: dcGame.game_name,
                });
              }

              gameDataList.push({
                aggregatorType: GameAggregatorType.DCS,
                provider: domainProvider,
                category,
                aggregatorGameId: dcGame.game_id,
                gameType: dcGame.game_type || null,
                tableId: null,
                iconLink: dcGame.game_icon || null,
                isEnabled: true,
                isVisibleToUser: true,
                translations,
              });
            }
          } else {
            result.errors.push(
              `DC API call failed: code=${dcResponse.code}, msg=${dcResponse.msg}`,
            );
          }
        } catch (error) {
          this.logger.error(error, 'DC game list fetch failed');
          result.errors.push(
            `DC game list fetch failed: ${error.message || 'Unknown error'}`,
          );
        }
      } else if (aggregatorType === GameAggregatorType.WHITECLIFF) {
        // WC 모듈의 서비스 호출 (ModuleRef를 통해 동적 주입)
        // TODO: 구현 필요
        result.errors.push('Whitecliff 게임 동기화는 아직 구현되지 않았습니다.');
        return result;
      } else {
        result.errors.push(
          `지원하지 않는 애그리게이터 타입: ${aggregatorType}`,
        );
        return result;
      }

      // 게임 데이터가 있으면 upsert 처리
      if (gameDataList.length > 0) {
        result.total = gameDataList.length;

        for (const gameData of gameDataList) {
          try {
            const { created } = await this.upsertGame(gameData);
            if (created) {
              result.created++;
            } else {
              result.updated++;
            }
          } catch (error) {
            this.logger.error(
              error,
              `게임 upsert 실패: aggregatorGameId=${gameData.aggregatorGameId}`,
            );
            result.errors.push(
              `게임 upsert 실패 (aggregatorGameId: ${gameData.aggregatorGameId}): ${error.message}`,
            );
          }
        }
      }

      return result;
    } catch (error) {
      this.logger.error(error, '게임 동기화 중 오류 발생');
      result.errors.push(error.message || 'Unknown error');
      throw error;
    }
  }

  /**
   * 게임 생성 또는 업데이트
   * @private
   */
  private async upsertGame(
    gameData: {
      aggregatorType: GameAggregatorType;
      provider: GameProvider;
      category: GameCategory;
      aggregatorGameId: number;
      gameType?: string | null;
      tableId?: string | null;
      iconLink?: string | null;
      isEnabled?: boolean;
      isVisibleToUser?: boolean;
      translations?: Array<{
        language: Language;
        providerName: string;
        categoryName: string;
        gameName: string;
      }>;
    },
  ): Promise<{ created: boolean; game: Game }> {
    // 기존 게임 조회 (aggregatorType, provider, aggregatorGameId로)
    const existingGames = await this.repository.findMany({
      filters: {
        aggregatorType: gameData.aggregatorType,
        provider: gameData.provider,
      },
    });

    const existingGame = existingGames.find(
      (g) => g.aggregatorGameId === gameData.aggregatorGameId,
    );

    if (existingGame) {
      // 기존 게임 업데이트
      existingGame.update({
        gameType: gameData.gameType,
        tableId: gameData.tableId,
        iconLink: gameData.iconLink,
        isEnabled: gameData.isEnabled ?? true,
        isVisibleToUser: gameData.isVisibleToUser ?? true,
      });

      const updatedGame = await this.repository.save(existingGame);

      // 번역 정보 업데이트
      if (gameData.translations && gameData.translations.length > 0) {
        // TODO: 번역 정보 업데이트 로직 구현
        // repository에 saveTranslation 메서드가 있지만, createTranslation도 필요할 수 있음
      }

      return { created: false, game: updatedGame };
    } else {
      // 새 게임 생성
      const newGame = Game.create({
        uid: generateUid(),
        aggregatorType: gameData.aggregatorType,
        provider: gameData.provider,
        category: gameData.category,
        aggregatorGameId: gameData.aggregatorGameId,
        gameType: gameData.gameType ?? undefined,
        tableId: gameData.tableId ?? undefined,
        iconLink: gameData.iconLink ?? undefined,
        isEnabled: gameData.isEnabled ?? true,
        isVisibleToUser: gameData.isVisibleToUser ?? true,
      });

      // 번역 정보 준비
      const translations = gameData.translations?.map((t) => ({
        uid: generateUid(),
        language: t.language,
        providerName: t.providerName,
        categoryName: t.categoryName,
        gameName: t.gameName,
      }));

      const createdGame = await this.repository.create(newGame, translations);

      return { created: true, game: createdGame };
    }
  }

  /**
   * 프로바이더에 따라 애그리게이터 타입 결정
   * @private
   */
  private getAggregatorTypeByProvider(
    provider: GameProvider,
  ): GameAggregatorType | null {
    // DC 애그리게이터를 사용하는 프로바이더
    if (
      provider === GameProvider.RELAX_GAMING ||
      provider === GameProvider.PLAYNGO
    ) {
      return GameAggregatorType.DCS;
    }

    // Whitecliff 애그리게이터를 사용하는 프로바이더
    if (
      provider === GameProvider.EVOLUTION ||
      provider === GameProvider.PRAGMATIC_PLAY_LIVE ||
      provider === GameProvider.PG_SOFT ||
      provider === GameProvider.PRAGMATIC_PLAY_SLOTS
    ) {
      return GameAggregatorType.WHITECLIFF;
    }

    return null;
  }
}


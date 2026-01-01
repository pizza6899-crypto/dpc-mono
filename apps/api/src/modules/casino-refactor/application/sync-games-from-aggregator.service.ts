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
import { WC_AGGREGATOR_API } from '../aggregator/wc/ports/out/wc-aggregator-api.token';
import type { WcAggregatorApiPort } from '../aggregator/wc/ports/out/wc-aggregator-api.port';
import { WcMapperService } from '../aggregator/wc/infrastructure/wc-mapper.service';
import { GameTranslation } from '../domain';
import { DispatchLogService } from 'src/modules/audit-log/application/dispatch-log.service';
import { LogType } from 'src/modules/audit-log/domain';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';

interface SyncGamesFromAggregatorParams {
  provider?: GameProvider;
  adminUserId?: string;
  clientInfo?: RequestClientInfo;
}

interface SyncGamesResult {
  total: number;
  created: number;
  updated: number;
  disabled: number;
  errors: string[];
}

interface GameData {
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
    @Inject(WC_AGGREGATOR_API)
    private readonly wcAdapter: WcAggregatorApiPort,
    private readonly wcMapper: WcMapperService,
    private readonly dispatchLogService: DispatchLogService,
  ) {}

  async execute(
    params: SyncGamesFromAggregatorParams,
  ): Promise<SyncGamesResult> {
    const startTime = Date.now();
    const result: SyncGamesResult = {
      total: 0,
      created: 0,
      updated: 0,
      disabled: 0,
      errors: [],
    };

    try {
      // provider가 없으면 전체 프로바이더 동기화
      const providers = params.provider
        ? [params.provider]
        : [
            GameProvider.RELAX_GAMING,
            GameProvider.PLAYNGO,
            GameProvider.EVOLUTION,
            GameProvider.PRAGMATIC_PLAY_LIVE,
            GameProvider.PG_SOFT,
            GameProvider.PRAGMATIC_PLAY_SLOTS,
          ];

      // 각 프로바이더별로 동기화 수행
      for (const provider of providers) {
        try {
          const providerResult = await this.syncProvider(
            provider,
            params.adminUserId,
            params.clientInfo,
          );
          result.total += providerResult.total;
          result.created += providerResult.created;
          result.updated += providerResult.updated;
          result.disabled += providerResult.disabled;
          result.errors.push(...providerResult.errors);
        } catch (error) {
          result.errors.push(
            `Provider sync failed (${provider}): ${error.message || 'Unknown error'}`,
          );

          // Audit 시스템 에러 로그 저장
          this.dispatchLogService.dispatch(
            {
              type: LogType.ERROR,
              data: {
                userId: params.adminUserId,
                errorCode: 'PROVIDER_SYNC_FAILED',
                errorMessage: `프로바이더 동기화 실패: ${provider} - ${error.message || 'Unknown error'}`,
                stackTrace: error instanceof Error ? error.stack : undefined,
                path: '/admin/games/sync',
                method: 'POST',
                severity: 'ERROR',
              },
            },
            params.clientInfo,
          );
        }
      }

      const duration = Date.now() - startTime;
      const hasErrors = result.errors.length > 0;

      // Audit 로그 저장 (전체 동기화 결과)
      this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: params.adminUserId,
            category: 'ADMIN',
            action: 'SYNC_GAMES_FROM_AGGREGATOR',
            metadata: {
              provider: params.provider || 'ALL',
              providers: providers,
              total: result.total,
              created: result.created,
              updated: result.updated,
              disabled: result.disabled,
              errorCount: result.errors.length,
              duration,
              success: !hasErrors,
              errors: hasErrors ? result.errors : undefined,
            },
          },
        },
        params.clientInfo,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      result.errors.push(error.message || 'Unknown error');

      // Audit 시스템 에러 로그 저장
      this.dispatchLogService.dispatch(
        {
          type: LogType.ERROR,
          data: {
            userId: params.adminUserId,
            errorCode: 'SYNC_GAMES_FROM_AGGREGATOR_FAILED',
            errorMessage: `게임 동기화 중 오류 발생: ${error.message || 'Unknown error'}`,
            stackTrace: error instanceof Error ? error.stack : undefined,
            path: '/admin/games/sync',
            method: 'POST',
            severity: 'ERROR',
          },
        },
        params.clientInfo,
      );

      // Audit 활동 로그 저장 (에러 발생)
      this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: params.adminUserId,
            category: 'ADMIN',
            action: 'SYNC_GAMES_FROM_AGGREGATOR',
            metadata: {
              provider: params.provider || 'ALL',
              error: error.message || 'Unknown error',
              duration,
              success: false,
            },
          },
        },
        params.clientInfo,
      );

      throw error;
    }
  }

  /**
   * 단일 프로바이더 동기화
   * @private
   */
  private async syncProvider(
    provider: GameProvider,
    adminUserId?: string,
    clientInfo?: RequestClientInfo,
  ): Promise<SyncGamesResult> {
    const startTime = Date.now();

    const result: SyncGamesResult = {
      total: 0,
      created: 0,
      updated: 0,
      disabled: 0,
      errors: [],
    };

    try {
      // 프로바이더에 따라 애그리게이터 결정
      const aggregatorType = this.getAggregatorTypeByProvider(provider);
      if (!aggregatorType) {
        result.errors.push(`Unsupported provider: ${provider}`);
        return result;
      }

      // 애그리게이터 타입에 따라 게임 데이터 가져오기
      let gameDataList: GameData[] = [];

      if (aggregatorType === GameAggregatorType.DCS) {
        const { data, errors } = await this.fetchAndParseDcGames(
          provider,
          adminUserId,
          clientInfo,
        );
        gameDataList = data;
        result.errors.push(...errors);
      } else if (aggregatorType === GameAggregatorType.WHITECLIFF) {
        const { data, errors } = await this.fetchAndParseWcGames(
          provider,
          adminUserId,
          clientInfo,
        );
        gameDataList = data;
        result.errors.push(...errors);
      } else {
        result.errors.push(
          `Unsupported aggregator type: ${aggregatorType}`,
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

            // Audit 시스템 에러 로그 저장 (개별 게임 upsert 실패는 WARN 레벨)
            this.dispatchLogService.dispatch(
              {
                type: LogType.ERROR,
                data: {
                  errorCode: 'GAME_UPSERT_FAILED',
                  errorMessage: `게임 upsert 실패: aggregatorGameId=${gameData.aggregatorGameId}, provider=${gameData.provider}`,
                  stackTrace: error instanceof Error ? error.stack : undefined,
                  path: '/admin/games/sync',
                  method: 'POST',
                  severity: 'WARN', // 개별 게임 실패는 WARN 레벨
                },
              },
            );
          }
        }
      }

      const duration = Date.now() - startTime;
      const hasErrors = result.errors.length > 0;

      // Audit 로그 저장 (프로바이더별 동기화 결과)
      this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: adminUserId,
            category: 'ADMIN',
            action: 'SYNC_GAMES_FROM_AGGREGATOR_PROVIDER',
            metadata: {
              provider,
              total: result.total,
              created: result.created,
              updated: result.updated,
              disabled: result.disabled,
              errorCount: result.errors.length,
              duration,
              success: !hasErrors,
              errors: hasErrors ? result.errors : undefined,
            },
          },
        },
        clientInfo,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        error,
        `프로바이더 동기화 중 오류 발생: provider=${provider}`,
      );
      result.errors.push(error.message || 'Unknown error');

      // Audit 시스템 에러 로그 저장
      this.dispatchLogService.dispatch(
        {
          type: LogType.ERROR,
          data: {
            userId: adminUserId,
            errorCode: 'PROVIDER_SYNC_FAILED',
            errorMessage: `프로바이더 동기화 중 오류 발생: provider=${provider} - ${error.message || 'Unknown error'}`,
            stackTrace: error instanceof Error ? error.stack : undefined,
            path: '/admin/games/sync',
            method: 'POST',
            severity: 'ERROR',
          },
        },
        clientInfo,
      );

      // Audit 활동 로그 저장 (프로바이더별 동기화 실패)
      this.dispatchLogService.dispatch(
        {
          type: LogType.ACTIVITY,
          data: {
            userId: adminUserId,
            category: 'ADMIN',
            action: 'SYNC_GAMES_FROM_AGGREGATOR_PROVIDER',
            metadata: {
              provider,
              error: error.message || 'Unknown error',
              duration,
              success: false,
            },
          },
        },
        clientInfo,
      );

      return result;
    }
  }

  /**
   * DC 애그리게이터에서 게임 데이터 가져오기 및 파싱
   * @private
   */
  private async fetchAndParseDcGames(
    provider: GameProvider,
    adminUserId?: string,
    clientInfo?: RequestClientInfo,
  ): Promise<{ data: GameData[]; errors: string[] }> {
    const errors: string[] = [];
    const gameDataList: GameData[] = [];

    try {
      const dcResponse = await this.dcAdapter.getGameList({ provider });

      if (dcResponse.code === 1000 && dcResponse.data) {
        for (const dcGame of dcResponse.data) {
          const domainProvider = this.dcMapper.toDomainProvider(dcGame.provider);
          if (!domainProvider) {
            continue;
          }

          const gameData = this.convertDcGameToGameData(dcGame, domainProvider);
          if (gameData) {
            gameDataList.push(gameData);
          }
        }
      } else {
        const errorMessage = `DC API call failed: code=${dcResponse.code}, msg=${dcResponse.msg}`;
        errors.push(errorMessage);

        // Audit 시스템 에러 로그 저장
        this.dispatchLogService.dispatch(
          {
            type: LogType.ERROR,
            data: {
              userId: adminUserId,
              errorCode: 'DC_API_CALL_FAILED',
              errorMessage,
              path: '/admin/games/sync',
              method: 'POST',
              severity: 'ERROR',
            },
          },
          clientInfo,
        );
      }
    } catch (error) {
      this.logger.error(error, 'DC game list fetch failed');
      const errorMessage = `DC game list fetch failed: ${error.message || 'Unknown error'}`;
      errors.push(errorMessage);

      // Audit 시스템 에러 로그 저장
      this.dispatchLogService.dispatch(
        {
          type: LogType.ERROR,
          data: {
            userId: adminUserId,
            errorCode: 'DC_GAME_LIST_FETCH_FAILED',
            errorMessage,
            stackTrace: error instanceof Error ? error.stack : undefined,
            path: '/admin/games/sync',
            method: 'POST',
            severity: 'ERROR',
          },
        },
        clientInfo,
      );
    }

    return { data: gameDataList, errors };
  }

  /**
   * WC 애그리게이터에서 게임 데이터 가져오기 및 파싱
   * @private
   */
  private async fetchAndParseWcGames(
    provider: GameProvider,
    adminUserId?: string,
    clientInfo?: RequestClientInfo,
  ): Promise<{ data: GameData[]; errors: string[] }> {
    const errors: string[] = [];
    const gameDataList: GameData[] = [];

    try {
      const wcResponse = await this.wcAdapter.getGameList({ provider });

      if (wcResponse.status === 1 && wcResponse.game_list) {
        // EVOLUTION 프로바이더인 경우, 추가 prd_id들도 처리
        if (provider === GameProvider.EVOLUTION) {
          // 모든 prd_id (1: 아시아, 29: 인도, 31: 코리아) - 유저에게 보이지 않음
          const evolutionPrdIds = [1, 29, 31];
          for (const prdId of evolutionPrdIds) {
            const games = wcResponse.game_list[prdId.toString()];
            if (games && Array.isArray(games)) {
              for (const wcGame of games) {
                const gameData = this.convertWcGameToGameData(
                  wcGame,
                  provider,
                  false, // isVisibleToUser: false
                );
                if (gameData) {
                  gameDataList.push(gameData);
                }
              }
            }
          }
        } else {
          // 다른 프로바이더는 기존 로직대로
          const prd_id = this.wcMapper.toWcProvider(provider);
          const prdIdKey = prd_id?.toString() || '';
          const games = wcResponse.game_list[prdIdKey];

          if (games && Array.isArray(games)) {
            for (const wcGame of games) {
              const gameData = this.convertWcGameToGameData(wcGame, provider);
              if (gameData) {
                gameDataList.push(gameData);
              }
            }
          }
        }
      } else {
        const errorMessage = `WC API call failed: status=${wcResponse.status}, error=${wcResponse.error || 'Unknown error'}`;
        errors.push(errorMessage);

        // Audit 시스템 에러 로그 저장
        this.dispatchLogService.dispatch(
          {
            type: LogType.ERROR,
            data: {
              userId: adminUserId,
              errorCode: 'WC_API_CALL_FAILED',
              errorMessage,
              path: '/admin/games/sync',
              method: 'POST',
              severity: 'ERROR',
            },
          },
          clientInfo,
        );
      }
    } catch (error) {
      this.logger.error(error, 'WC game list fetch failed');
      const errorMessage = `WC game list fetch failed: ${error.message || 'Unknown error'}`;
      errors.push(errorMessage);

      // Audit 시스템 에러 로그 저장
      this.dispatchLogService.dispatch(
        {
          type: LogType.ERROR,
          data: {
            userId: adminUserId,
            errorCode: 'WC_GAME_LIST_FETCH_FAILED',
            errorMessage,
            stackTrace: error instanceof Error ? error.stack : undefined,
            path: '/admin/games/sync',
            method: 'POST',
            severity: 'ERROR',
          },
        },
        clientInfo,
      );
    }

    return { data: gameDataList, errors };
  }

  /**
   * DC 게임 응답을 GameData로 변환
   * @private
   */
  private convertDcGameToGameData(
    dcGame: any,
    provider: GameProvider,
  ): GameData | null {
    // 카테고리 매핑 (content_type 사용)
    const category =
      this.dcMapper.toDomainCategory(dcGame.content_type || '') ||
      GameCategory.SLOTS; // 기본값

    // 번역 정보 생성
    const translations = this.createDcTranslations(dcGame);

    return {
      aggregatorType: GameAggregatorType.DCS,
      provider,
      category,
      aggregatorGameId: dcGame.game_id,
      gameType: dcGame.game_type || null,
      tableId: null,
      iconLink: dcGame.game_icon || null,
      isEnabled: true,
      isVisibleToUser: true,
      translations,
    };
  }

  /**
   * WC 게임 응답을 GameData로 변환
   * @private
   */
  private convertWcGameToGameData(
    wcGame: any,
    provider: GameProvider,
    isVisibleToUser: boolean = true,
  ): GameData | null {
    // 카테고리 매핑
    const category =
      this.wcMapper.toDomainCategory(wcGame.prd_category) ||
      GameCategory.SLOTS; // 기본값

    // 번역 정보 생성
    const translations = this.createWcTranslations(wcGame);

    return {
      aggregatorType: GameAggregatorType.WHITECLIFF,
      provider,
      category,
      aggregatorGameId: wcGame.game_id,
      gameType: wcGame.game_type || null,
      tableId: wcGame.table_id || null,
      iconLink: wcGame.game_icon_link || wcGame.game_icon_link_sq || null,
      isEnabled: wcGame.is_enabled === 1,
      isVisibleToUser: isVisibleToUser && wcGame.is_enabled === 1,
      translations,
    };
  }

  /**
   * DC 게임 번역 정보 생성
   * @private
   */
  private createDcTranslations(dcGame: any): Array<{
    language: Language;
    providerName: string;
    categoryName: string;
    gameName: string;
  }> {
    const translations: Array<{
      language: Language;
      providerName: string;
      categoryName: string;
      gameName: string;
    }> = [];

    if (dcGame.game_name) {
      translations.push({
        language: Language.EN,
        providerName: dcGame.content || dcGame.provider,
        categoryName: dcGame.content_type || 'Standard',
        gameName: dcGame.game_name,
      });
    }

    return translations;
  }

  /**
   * WC 게임 번역 정보 생성
   * @private
   */
  private createWcTranslations(wcGame: any): Array<{
    language: Language;
    providerName: string;
    categoryName: string;
    gameName: string;
  }> {
    const translations: Array<{
      language: Language;
      providerName: string;
      categoryName: string;
      gameName: string;
    }> = [];

    if (wcGame.game_name) {
      translations.push({
        language: Language.EN,
        providerName: wcGame.prd_name || '',
        categoryName: wcGame.prd_category || '',
        gameName: wcGame.game_name,
      });
    }

    return translations;
  }

  /**
   * 게임 생성 또는 업데이트
   * @private
   */
  private async upsertGame(
    gameData: GameData,
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

      // 번역 정보 업데이트 또는 생성
      if (gameData.translations && gameData.translations.length > 0) {
        // 기존 게임의 번역 정보 조회
        const gameWithTranslations = await this.repository.getByUid(
          updatedGame.uid,
          { includeTranslations: true },
        );

        for (const translationData of gameData.translations) {
          const existingTranslation = gameWithTranslations.getTranslation(
            translationData.language,
          );

          if (existingTranslation) {
            // 기존 번역 업데이트
            existingTranslation.update({
              providerName: translationData.providerName,
              categoryName: translationData.categoryName,
              gameName: translationData.gameName,
            });
            await this.repository.saveTranslation(existingTranslation);
          } else {
            // 새 번역 생성
            const newTranslation = GameTranslation.create({
              uid: generateUid(),
              gameId: gameWithTranslations.id!,
              language: translationData.language,
              providerName: translationData.providerName,
              categoryName: translationData.categoryName,
              gameName: translationData.gameName,
            });
            await this.repository.createTranslation(newTranslation);
          }
        }
      }

      // 최종 게임 정보 조회 (번역 정보 포함)
      const finalGame = await this.repository.getByUid(updatedGame.uid, {
        includeTranslations: true,
      });

      return { created: false, game: finalGame };
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


// src/modules/casino-refactor/application/sync-games-from-aggregator.service.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { GAME_REPOSITORY } from '../ports/out/game.repository.token';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import { Game, GameTranslation } from '../domain';
import {
  GameAggregatorType,
  GameProvider,
  GameCategory,
  Language,
  Prisma,
} from '@repo/database';
import { generateUid } from 'src/utils/id.util';
import { GamingCurrencyCode, GAMING_CURRENCIES } from 'src/utils/currency.util';
import { SyncGamesFromWcService } from '../aggregator/wc/application/sync-games-from-wc.service';

interface SyncGamesFromAggregatorParams {
  aggregatorType: GameAggregatorType;
  provider?: GameProvider;
  language?: Language;
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
    private readonly moduleRef: ModuleRef,
  ) {}

  async execute(
    params: SyncGamesFromAggregatorParams,
  ): Promise<SyncGamesResult> {
    this.logger.log(
      `게임 동기화 시작: aggregatorType=${params.aggregatorType}, provider=${params.provider}`,
    );

    const result: SyncGamesResult = {
      total: 0,
      created: 0,
      updated: 0,
      disabled: 0,
      errors: [],
    };

    try {
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

      if (params.aggregatorType === GameAggregatorType.WHITECLIFF) {
        // WC 모듈의 서비스 호출 (ModuleRef를 통해 동적 주입)
        try {
          const syncGamesFromWcService = this.moduleRef.get(
            SyncGamesFromWcService,
            { strict: false },
          );

          if (!syncGamesFromWcService) {
            result.errors.push(
              'WC 게임 동기화 서비스가 등록되지 않았습니다. WcModule을 import해야 합니다.',
            );
            return result;
          }

          // 기본 게임 통화는 USDT 사용 (또는 첫 번째 게임 통화)
          const gameCurrency: GamingCurrencyCode =
            GAMING_CURRENCIES[0] || 'USDT';
          const language = params.language || Language.EN;

          const wcResult = await syncGamesFromWcService.execute({
            gameCurrency,
            language,
            provider: params.provider,
          });

          if (wcResult.errors.length > 0) {
            result.errors.push(...wcResult.errors);
          }

          gameDataList = wcResult.gameDataList;
        } catch (error) {
          this.logger.error(error, 'WC 게임 동기화 서비스 호출 실패');
          result.errors.push(
            `WC 게임 동기화 서비스 호출 실패: ${error.message}`,
          );
        }
      } else if (params.aggregatorType === GameAggregatorType.DCS) {
        // TODO: DC 모듈의 서비스 호출
        this.logger.warn(
          'DC 게임 동기화는 아직 구현되지 않았습니다.',
        );
        result.errors.push('DC 게임 동기화는 아직 구현되지 않았습니다.');
        return result;
      } else {
        result.errors.push(
          `지원하지 않는 애그리게이터 타입: ${params.aggregatorType}`,
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
}


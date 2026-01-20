import { Injectable, Logger } from '@nestjs/common';
import {
  ProductGameListResponse,
  WhitecliffApiService,
} from '../infrastructure/whitecliff-api.service';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import { GameListUpdateStatusDto } from '../dtos/game-update.dto';
import { nowUtc } from 'src/utils/date.util';
import { WhitecliffMapperService } from '../infrastructure/whitecliff-mapper.service';
import {
  GameAggregatorType,
  GameCategory,
  Language,
  GameProvider,
} from '@repo/database';
import { toLanguageEnum } from 'src/utils/language.util';
import { GAMING_CURRENCIES } from 'src/utils/currency.util';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

@Injectable()
export class WhitecliffGameRefreshService {
  private readonly logger = new Logger(WhitecliffGameRefreshService.name);
  private readonly STATUS_KEY = 'whitecliff:game-list:update-status';

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly whitecliffApiService: WhitecliffApiService,
    private readonly redisService: RedisService,
    private readonly whitecliffMapperService: WhitecliffMapperService,
  ) { }

  /**
   * 게임 목록을 수동으로 업데이트합니다.
   * 비동기적으로 처리되며 즉시 응답을 반환합니다.
   */
  async updateGameListManually(
    language: string,
  ): Promise<{ success: boolean; message: string }> {
    // Redis에서 현재 상태 확인
    const currentStatus = await this.getUpdateStatus();

    if (currentStatus.isRunning) {
      return {
        success: false,
        message: 'Game list update is already in progress.',
      };
    }

    // 비동기로 실행 (즉시 응답 반환)
    this.runGameListUpdate(toLanguageEnum(language)).catch((error) => {
      this.logger.error(error, '게임 목록 업데이트 중 오류 발생');
      this.setUpdateStatus({
        isRunning: false,
        error: error.message,
      });
    });

    return {
      success: true,
      message: 'Game list update has been started.',
    };
  }

  /**
   * 현재 업데이트 상태를 Redis에서 조회합니다.
   */
  async getUpdateStatus(): Promise<GameListUpdateStatusDto> {
    try {
      const status = await this.redisService.get<GameListUpdateStatusDto>(
        this.STATUS_KEY,
      );
      return status || { isRunning: false };
    } catch (error) {
      this.logger.error(error, '상태 조회 실패');
      return { isRunning: false };
    }
  }

  /**
   * 업데이트 상태를 Redis에 저장합니다.
   */
  private async setUpdateStatus(
    status: GameListUpdateStatusDto,
  ): Promise<void> {
    try {
      await this.redisService.set(this.STATUS_KEY, status, 3600); // 1시간 TTL
    } catch (error) {
      this.logger.error(error, '상태 저장 실패');
    }
  }

  private async runGameListUpdate(language: Language): Promise<void> {
    // 시작 상태 저장
    await this.setUpdateStatus({
      isRunning: true,
      progress: {
        total: 0,
        processed: 0,
        created: 0,
        updated: 0,
        disabled: 0,
      },
    });

    try {
      // const response = mockResponse2;
      const response = await this.whitecliffApiService.getProductGameList({
        gameCurrency: GAMING_CURRENCIES[0],
        language,
      });

      if (response.status !== 1) {
        throw new Error(`API 응답 오류: ${response.status}`);
      }

      const productGameList = response as any as ProductGameListResponse;
      const gameList = productGameList.game_list;

      // 필터링 대상 Product ID:
      // 1   - 에볼루션 아시아
      // 28  - 프라그매틱 플레이 라이브
      // 29  - 에볼루션 인도
      // 31  - 에볼루션 한국
      // 226 - 프라그매틱 플레이 슬롯
      const TARGET_PRODUCT_IDS = ['1', '28', '29', '31', '226'];
      const filteredGameList: any = {};

      for (const productId of TARGET_PRODUCT_IDS) {
        const productGames = gameList[productId];
        if (productGames && productGames.length > 0) {
          filteredGameList[productId] = productGames;
        }
      }

      // 필터링된 게임이 없으면 종료
      if (Object.keys(filteredGameList).length === 0) {
        await this.setUpdateStatus({
          isRunning: false,
          lastUpdate: nowUtc(),
          progress: {
            total: 0,
            processed: 0,
            created: 0,
            updated: 0,
            disabled: 0,
          },
        });
        return;
      }

      await this.updateGamesSequentially(filteredGameList, language);

      // 완료 상태 저장
      await this.setUpdateStatus({
        isRunning: false,
        lastUpdate: nowUtc(),
      });
    } catch (error) {
      // 오류 상태 저장
      await this.setUpdateStatus({
        isRunning: false,
        error: error.message,
      });
      throw error;
    }
  }

  private async updateGamesSequentially(gameList: any, lang: Language) {
    let totalOperations = 0;
    let updatedCount = 0;
    let createdCount = 0;
    let disabledCount = 0;

    // 총 게임 수 계산
    const totalGames = Object.values(gameList).reduce(
      (sum: number, games: any) => sum + (games as any[]).length,
      0,
    );

    // 진행 상황 초기화
    await this.setUpdateStatus({
      isRunning: true,
      progress: {
        total: totalGames as number,
        processed: 0,
        created: 0,
        updated: 0,
        disabled: 0,
      },
    });

    // 각 provider별로 순차 처리
    for (const [providerIdStr, games] of Object.entries(gameList)) {
      const providerId = parseInt(providerIdStr);

      const existingGames = await this.tx.casinoGame.findMany({
        where: {
          provider:
            this.whitecliffMapperService.fromWhitecliffProvider(providerId)!,
        },
        select: {
          id: true,
          provider: true,
          gameId: true,
          isEnabled: true,
          tableId: true,
          gameType: true,
          translations: {
            where: { language: toLanguageEnum(lang) },
            select: {
              language: true,
              providerName: true,
              categoryName: true,
              gameName: true,
            },
          },
        },
      });

      const existingGameMap = new Map<string, typeof existingGames[number]>(
        existingGames.map((game) => [`${game.gameId}`, game]),
      );

      // 각 게임을 순차적으로 처리
      for (const gameData of games as any[]) {
        const existingGame = existingGameMap.get(`${gameData.game_id}`);

        try {
          if (existingGame) {
            // 🔄 기존 게임 업데이트 (변경사항이 있을 때만)
            if (this.hasGameChanges(existingGame, gameData, lang)) {
              await this.updateExistingGame(existingGame.id, gameData, lang);
              updatedCount++;
            }
          } else {
            // ➕ 새 게임 추가
            await this.createNewGame(providerId, gameData, lang);
            createdCount++;
          }

          await this.sleep(10); // 10ms 대기
        } catch (error) {
          this.logger.error(error, `게임 처리 실패: ${gameData.game_name}`);
        }

        totalOperations++;

        // 진행 상황을 Redis에 주기적으로 업데이트 (10개마다)
        if (totalOperations % 10 === 0) {
          await this.setUpdateStatus({
            isRunning: true,
            progress: {
              total: totalGames as number,
              processed: totalOperations,
              created: createdCount,
              updated: updatedCount,
              disabled: disabledCount,
            },
          });
        }
      }

      // 🗑️ API에서 제거된 게임들 비활성화
      const apiGameIds = new Set((games as any[]).map((g) => g.game_id));
      const toDisableGames = existingGames.filter(
        (game) =>
          !apiGameIds.has(game.gameId) && game.isEnabled && game.gameId !== 0, // 로비 게임 제외
      );

      for (const game of toDisableGames) {
        try {
          await this.tx.casinoGame.update({
            where: { id: game.id },
            data: { isEnabled: false },
          });
          disabledCount++;

          await this.sleep(10);
        } catch (error) {
          this.logger.error(error, `게임 비활성화 실패: ID ${game.gameId}`);
        }
      }
    }

    // 최종 완료 상태 저장
    await this.setUpdateStatus({
      isRunning: false,
      lastUpdate: nowUtc(),
      progress: {
        total: totalGames as number,
        processed: totalOperations,
        created: createdCount,
        updated: updatedCount,
        disabled: disabledCount,
      },
    });

    this.logger.log(
      `게임 목록 업데이트 완료 - 총 ${totalOperations}개 처리 (생성: ${createdCount}, 업데이트: ${updatedCount}, 비활성화: ${disabledCount})`,
    );
  }

  private hasGameChanges(
    existingGame: any,
    newGameData: any,
    lang: Language,
  ): boolean {
    // 기본 게임 정보 변경사항 확인
    const basicChanges =
      existingGame.isEnabled !== Boolean(newGameData.is_enabled) ||
      existingGame.tableId !== (newGameData.table_id || null) ||
      existingGame.gameType !== (newGameData.game_type || null);

    // 번역 정보 변경사항 확인
    const translation = existingGame.translations?.[0]; // 해당 언어의 번역 정보
    const translationChanges =
      !translation ||
      translation.providerName !== newGameData.prd_name ||
      translation.categoryName !== newGameData.prd_category ||
      translation.gameName !== newGameData.game_name;

    return basicChanges || translationChanges;
  }

  private async updateExistingGame(
    gameId: bigint,
    gameData: any,
    lang: Language,
  ) {
    // provider 정보 가져오기
    const existingGameWithProvider = await this.tx.casinoGame.findUnique({
      where: { id: gameId },
      select: { provider: true },
    });

    // ✅ 올바른 필드명으로 게임 정보 업데이트
    await this.tx.casinoGame.update({
      where: { id: gameId },
      data: {
        tableId: gameData.table_id || null,
        gameType: gameData.game_type || null,
        iconLink: this.extractIconPath(
          gameData.game_icon_link,
          existingGameWithProvider?.provider,
        ),
        isEnabled: Boolean(gameData.is_enabled),
      },
    });

    // ✅ 올바른 필드명으로 번역 정보 업데이트
    try {
      await this.tx.casinoGameTranslation.upsert({
        where: {
          gameId_language: {
            gameId: gameId,
            language: lang,
          },
        },
        update: {
          providerName: gameData.prd_name, // ✅ providerName
          categoryName: gameData.prd_category, // ✅ categoryName
          gameName: gameData.game_name, // ✅ gameName
        },
        create: {
          gameId: gameId,
          language: lang,
          providerName: gameData.prd_name, // ✅ providerName
          categoryName: gameData.prd_category, // ✅ categoryName
          gameName: gameData.game_name, // ✅ gameName
        },
      });
    } catch (error) {
      this.logger.error(error, `번역 업데이트 실패: 게임 ID ${gameId}`);
    }
  }

  private async createNewGame(
    providerId: number,
    gameData: any,
    lang: Language,
  ) {
    const category = this.whitecliffMapperService.fromWhitecliffCategory(
      gameData.prd_category,
    );

    const provider =
      this.whitecliffMapperService.fromWhitecliffProvider(providerId)!;

    // ✅ 올바른 필드명으로 게임 생성
    const newGame = await this.tx.casinoGame.create({
      data: {
        aggregatorType: GameAggregatorType.WHITECLIFF,
        provider: provider,
        gameId: gameData.game_id,
        category: this.whitecliffMapperService.fromWhitecliffCategory(
          gameData.prd_category,
        ),
        tableId: gameData.table_id || null,
        gameType: gameData.game_type || null,
        iconLink: this.extractIconPath(gameData.game_icon_link, provider),
        isEnabled: Boolean(gameData.is_enabled),
        isVisibleToUser: category !== GameCategory.LIVE_CASINO, // 라이브 카지노면 false
      },
    });

    // ✅ 올바른 필드명으로 번역 정보 생성
    try {
      await this.tx.casinoGameTranslation.create({
        data: {
          gameId: newGame.id,
          language: lang,
          providerName: gameData.prd_name, // ✅ providerName
          categoryName: gameData.prd_category, // ✅ categoryName
          gameName: gameData.game_name, // ✅ gameName
        },
      });
    } catch (error) {
      this.logger.error(error, `번역 생성 실패: 게임 ID ${newGame.id}`);
    }
  }

  // 🎯 아이콘 링크에서 도메인 제거하고 경로만 추출
  private extractIconPath(
    iconLink: string | null | undefined,
    provider?: GameProvider,
  ): string | null {
    if (!iconLink) {
      return null;
    }

    // PP 슬롯인 경우 특별 처리
    if (provider === GameProvider.PRAGMATIC_PLAY_SLOTS) {
      try {
        const url = new URL(iconLink);
        // 파일명 추출 (예: "1.png")
        const fileName = url.pathname.split('/').pop();
        if (fileName) {
          // /icons/pragmatic_play_slots/{파일명} 형식으로 반환
          return `/icons/pragmatic_play_slots/${fileName}`;
        }
      } catch (error) {
        this.logger.warn(`PP 슬롯 아이콘 링크 파싱 실패: ${iconLink}`, error);
      }
      return null;
    }

    // 기존 로직 (다른 provider들)
    try {
      // URL 객체로 파싱
      const url = new URL(iconLink);

      // pathname만 반환 (예: "/redtiger/slots/id/57.png")
      return url.pathname;
    } catch (error) {
      // URL 파싱 실패 시 원본 반환 또는 null
      this.logger.warn(`아이콘 링크 파싱 실패: ${iconLink}`, error);

      // 상대 경로인 경우 그대로 반환
      if (iconLink.startsWith('/')) {
        return iconLink;
      }

      // 잘못된 형식의 URL인 경우 null 반환
      return null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// src/modules/casino/dcs/application/dcs-game-refresh.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { DcsApiService } from '../infrastructure/dcs-api.service';
import {
  GameAggregatorType,
  GameProvider,
  Language,
  GameCategory,
} from '@repo/database';
import { DcsResponseCode } from '../constants/dcs-response-codes';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

@Injectable()
export class DcsGameRefreshService {
  private readonly logger = new Logger(DcsGameRefreshService.name);

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly dcsApiService: DcsApiService,
  ) { }

  /**
   * 게임 목록을 수동으로 업데이트합니다.
   * 비동기적으로 처리되며 즉시 응답을 반환합니다.
   */
  async updateGameListManually() {
    await this.runGameListUpdate(GameProvider.RELAX_GAMING);
    await this.runGameListUpdate(GameProvider.PLAYNGO);
  }

  /**
   * 게임 목록 업데이트 실행
   */
  private async runGameListUpdate(provider: GameProvider): Promise<void> {
    // const response = mockResponse1;
    const response = await this.dcsApiService.getGameList({ provider });

    if (response.code !== DcsResponseCode.SUCCESS) {
      throw new Error(`DCS API 응답 오류: ${response.code} - ${response.msg}`);
    }

    const gameList = response.data || [];

    if (gameList.length === 0) {
      return;
    }

    // API 응답에 있는 게임 ID 집합 생성
    const apiGameIds = new Set(gameList.map((g) => g.game_id));

    // 기존 게임 목록 조회 (해당 프로바이더의 DCS 게임만)
    const existingGames = await this.tx.casinoGame.findMany({
      where: {
        aggregatorType: GameAggregatorType.DCS,
        provider: provider,
      },
    });

    // API 응답에 있는 게임들 처리
    for (const gameData of gameList) {
      // 게임 생성 또는 업데이트
      const game = await this.tx.casinoGame.upsert({
        where: {
          aggregatorType_provider_gameId: {
            aggregatorType: GameAggregatorType.DCS,
            provider: provider,
            gameId: gameData.game_id,
          },
        },
        update: {
          gameType: gameData.game_type || null,
          iconLink: this.extractIconPath(gameData.game_icon, provider),
          isEnabled: true,
          isVisibleToUser: true,
        },
        create: {
          aggregatorType: GameAggregatorType.DCS,
          provider: provider,
          category: GameCategory.SLOTS,
          gameId: gameData.game_id,
          gameType: gameData.game_type || null,
          tableId: null,
          iconLink: this.extractIconPath(gameData.game_icon, provider),
          isEnabled: true,
          isVisibleToUser: true,
          translations: {
            create: [
              {
                language: Language.EN,
                providerName: gameData.content || '',
                categoryName: 'Slots',
                gameName: gameData.game_name,
              },
              {
                language: Language.KO,
                providerName: gameData.content || '',
                categoryName: '슬롯',
                gameName: gameData.game_name,
              },
              {
                language: Language.JA,
                providerName: gameData.content || '',
                categoryName: 'スロット',
                gameName: gameData.game_name,
              },
            ],
          },
        },
      });

      // 기존 게임인 경우 번역 업데이트
      if (game) {
        // 기존 번역이 없으면 생성
        for (const lang of [Language.EN, Language.KO, Language.JA]) {
          await this.tx.casinoGameTranslation.upsert({
            where: {
              gameId_language: {
                gameId: game.id,
                language: lang,
              },
            },
            update: {
              providerName: gameData.content || '',
              categoryName:
                lang === Language.EN
                  ? 'Slots'
                  : lang === Language.KO
                    ? '슬롯'
                    : 'スロット',
              gameName: gameData.game_name,
            },
            create: {
              gameId: game.id,
              language: lang,
              providerName: gameData.content || '',
              categoryName:
                lang === Language.EN
                  ? 'Slots'
                  : lang === Language.KO
                    ? '슬롯'
                    : 'スロット',
              gameName: gameData.game_name,
            },
          });
        }
      }
    }

    // ��️ API에서 제거된 게임들 비활성화
    const toDisableGames = existingGames.filter(
      (game) => !apiGameIds.has(game.gameId) && game.isEnabled,
    );

    for (const game of toDisableGames) {
      try {
        await this.tx.casinoGame.update({
          where: { id: game.id },
          data: { isEnabled: false },
        });
        this.logger.log(`게임 비활성화: gameId=${game.gameId}`);
      } catch (error) {
        this.logger.error(error, `게임 비활성화 실패: gameId=${game.gameId}`);
      }
    }
  }

  // 🎯 아이콘 링크에서 도메인 제거하고 경로만 추출
  private extractIconPath(
    iconLink: string | null | undefined,
    provider: GameProvider,
  ): string | null {
    if (!iconLink) {
      return null;
    }

    try {
      // URL 객체로 파싱
      const url = new URL(iconLink);

      // 파일명 추출 (예: "160002_5x Magic.png")
      const fileName = url.pathname.split('/').pop();

      if (!fileName) {
        return null;
      }

      // Provider에 따라 적절한 경로로 변환
      if (provider === GameProvider.PLAYNGO) {
        return `/icons/playngo/${fileName}`;
      } else if (provider === GameProvider.RELAX_GAMING) {
        return `/icons/relax_gaming/${fileName}`;
      }

      // 알 수 없는 provider인 경우 null 반환
      this.logger.warn(
        `알 수 없는 provider: ${provider}, iconLink: ${iconLink}`,
      );
      return null;
    } catch (error) {
      // URL 파싱 실패 시
      this.logger.warn(`아이콘 링크 파싱 실패: ${iconLink}`, error);

      // 상대 경로인 경우 그대로 반환
      if (iconLink.startsWith('/')) {
        return iconLink;
      }

      // 잘못된 형식의 URL인 경우 null 반환
      return null;
    }
  }
}

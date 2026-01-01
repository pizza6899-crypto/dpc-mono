// src/modules/casino-refactor/infrastructure/game.mapper.ts
import { Injectable } from '@nestjs/common';
import { Game, GameTranslation } from '../domain';
import type { Game as PrismaGame, GameTranslation as PrismaGameTranslation } from '@repo/database';
import type { Language } from '@repo/database';

/**
 * Game Mapper
 *
 * Prisma Game 엔티티와 Domain Game 엔티티 간 변환을 담당합니다.
 * Infrastructure 레이어에 위치하여 Domain → Infrastructure 의존을 방지합니다.
 */
@Injectable()
export class GameMapper {
  /**
   * Prisma Game 모델 → Domain Game 엔티티 변환
   */
  toDomain(
    prismaModel: PrismaGame & {
      translations?: PrismaGameTranslation[];
    },
  ): Game {
    return Game.fromPersistence({
      id: prismaModel.id,
      uid: prismaModel.uid,
      aggregatorType: prismaModel.aggregatorType,
      provider: prismaModel.provider,
      category: prismaModel.category,
      aggregatorGameId: prismaModel.aggregatorGameId,
      gameType: prismaModel.gameType,
      tableId: prismaModel.tableId,
      iconLink: prismaModel.iconLink,
      isEnabled: prismaModel.isEnabled,
      isVisibleToUser: prismaModel.isVisibleToUser,
      houseEdge: prismaModel.houseEdge,
      contributionRate: prismaModel.contributionRate,
      createdAt: prismaModel.createdAt,
      updatedAt: prismaModel.updatedAt,
      translations: prismaModel.translations?.map((t) => ({
        id: t.id,
        gameId: t.gameId,
        language: t.language,
        providerName: t.providerName,
        categoryName: t.categoryName,
        gameName: t.gameName,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    });
  }

  /**
   * Domain Game 엔티티 → Prisma 모델 변환
   */
  toPrisma(domain: Game): {
    aggregatorType: PrismaGame['aggregatorType'];
    provider: PrismaGame['provider'];
    category: PrismaGame['category'];
    aggregatorGameId: number;
    gameType: string | null;
    tableId: string | null;
    iconLink: string | null;
    isEnabled: boolean;
    isVisibleToUser: boolean;
    houseEdge: PrismaGame['houseEdge'];
    contributionRate: PrismaGame['contributionRate'];
    createdAt: Date;
    updatedAt: Date;
  } {
    const persistence = domain.toPersistence();
    return {
      aggregatorType: persistence.aggregatorType,
      provider: persistence.provider,
      category: persistence.category,
      aggregatorGameId: persistence.aggregatorGameId,
      gameType: persistence.gameType,
      tableId: persistence.tableId,
      iconLink: persistence.iconLink,
      isEnabled: persistence.isEnabled,
      isVisibleToUser: persistence.isVisibleToUser,
      houseEdge: persistence.houseEdge,
      contributionRate: persistence.contributionRate,
      createdAt: persistence.createdAt,
      updatedAt: persistence.updatedAt,
    };
  }

  /**
   * 언어 필터링된 번역 정보 추출
   */
  filterTranslationsByLanguage(
    translations: PrismaGameTranslation[] | undefined,
    language?: Language,
  ): PrismaGameTranslation[] | undefined {
    if (!translations || translations.length === 0) {
      return undefined;
    }

    if (language) {
      const filtered = translations.filter((t) => t.language === language);
      return filtered.length > 0 ? filtered : undefined;
    }

    return translations;
  }
}


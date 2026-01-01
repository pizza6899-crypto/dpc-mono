// src/modules/casino-refactor/infrastructure/game.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import type { GameRepositoryPort } from '../ports/out/game.repository.port';
import { Prisma } from '@repo/database';
import { Game, GameNotFoundException, GameTranslation } from '../domain';
import { GameMapper } from './game.mapper';
import type { Language, GameProvider, GameCategory, GameAggregatorType } from '@repo/database';

/**
 * Game Repository Implementation
 *
 * Prisma를 사용한 GameRepositoryPort 구현체입니다.
 */
@Injectable()
export class GameRepository implements GameRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: GameMapper,
  ) {}

  async findByUid(
    uid: string,
    options?: { includeTranslations?: boolean; language?: Language },
  ): Promise<Game | null> {
    const game = await this.tx.game.findUnique({
      where: { uid },
      include: {
        translations: options?.includeTranslations
          ? {
              where: options.language
                ? { language: options.language }
                : undefined,
            }
          : false,
      },
    });

    if (!game) {
      return null;
    }

    return this.mapper.toDomain(game);
  }

  async getByUid(
    uid: string,
    options?: { includeTranslations?: boolean; language?: Language },
  ): Promise<Game> {
    const game = await this.findByUid(uid, options);
    if (!game) {
      throw new GameNotFoundException(uid);
    }
    return game;
  }

  async findById(
    id: bigint,
    options?: { includeTranslations?: boolean; language?: Language },
  ): Promise<Game | null> {
    const game = await this.tx.game.findUnique({
      where: { id },
      include: {
        translations: options?.includeTranslations
          ? {
              where: options.language
                ? { language: options.language }
                : undefined,
            }
          : false,
      },
    });

    if (!game) {
      return null;
    }

    return this.mapper.toDomain(game);
  }

  async getById(
    id: bigint,
    options?: { includeTranslations?: boolean; language?: Language },
  ): Promise<Game> {
    const game = await this.findById(id, options);
    if (!game) {
      throw new GameNotFoundException(id.toString());
    }
    return game;
  }

  async findMany(options?: {
    includeTranslations?: boolean;
    language?: Language;
    filters?: {
      isEnabled?: boolean;
      isVisibleToUser?: boolean;
      provider?: string;
      category?: string;
      aggregatorType?: string;
    };
    limit?: number;
    offset?: number;
  }): Promise<Game[]> {
    const {
      includeTranslations = false,
      language,
      filters,
      limit,
      offset,
    } = options || {};

    // Where 조건 구성
    const where: Prisma.GameWhereInput = {
      ...(filters?.isEnabled !== undefined && { isEnabled: filters.isEnabled }),
      ...(filters?.isVisibleToUser !== undefined && {
        isVisibleToUser: filters.isVisibleToUser,
      }),
      ...(filters?.provider && { provider: filters.provider as GameProvider }),
      ...(filters?.category && {
        category: filters.category as GameCategory,
      }),
      ...(filters?.aggregatorType && {
        aggregatorType: filters.aggregatorType as GameAggregatorType,
      }),
    };

    const games = await this.tx.game.findMany({
      where,
      include: {
        translations: includeTranslations
          ? {
              where: language ? { language } : undefined,
            }
          : false,
      },
      take: limit,
      skip: offset,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return games.map((game) => this.mapper.toDomain(game));
  }

  async count(options?: {
    filters?: {
      isEnabled?: boolean;
      isVisibleToUser?: boolean;
      provider?: string;
      category?: string;
      aggregatorType?: string;
    };
  }): Promise<number> {
    const { filters } = options || {};

    // Where 조건 구성
    const where: Prisma.GameWhereInput = {
      ...(filters?.isEnabled !== undefined && { isEnabled: filters.isEnabled }),
      ...(filters?.isVisibleToUser !== undefined && {
        isVisibleToUser: filters.isVisibleToUser,
      }),
      ...(filters?.provider && { provider: filters.provider as GameProvider }),
      ...(filters?.category && {
        category: filters.category as GameCategory,
      }),
      ...(filters?.aggregatorType && {
        aggregatorType: filters.aggregatorType as GameAggregatorType,
      }),
    };

    return await this.tx.game.count({ where });
  }

  async create(
    game: Game,
    translations?: Array<{
      uid: string;
      language: Language;
      providerName: string;
      categoryName: string;
      gameName: string;
    }>,
  ): Promise<Game> {
    if (game.id !== null) {
      throw new Error('Cannot create game with existing id');
    }

    const prismaData = this.mapper.toPrisma(game);
    const gameTranslations =
      translations ||
      (game.hasTranslations()
        ? game.getTranslations().map((t) => ({
            uid: t.uid,
            language: t.language,
            providerName: t.providerName,
            categoryName: t.categoryName,
            gameName: t.gameName,
          }))
        : undefined);

    const createdGame = await this.tx.game.create({
      data: {
        ...prismaData,
        translations: gameTranslations
          ? {
              create: gameTranslations,
            }
          : undefined,
      },
      include: {
        translations: true,
      },
    });

    return this.mapper.toDomain(createdGame);
  }

  async save(game: Game): Promise<Game> {
    if (game.id === null) {
      throw new Error('Cannot save game without id');
    }

    const prismaData = this.mapper.toPrisma(game);

    const updatedGame = await this.tx.game.update({
      where: { id: game.id },
      data: prismaData,
      include: {
        translations: true,
      },
    });

    return this.mapper.toDomain(updatedGame);
  }

  async saveTranslation(translation: GameTranslation): Promise<GameTranslation> {
    if (translation.id === null) {
      throw new Error('Cannot save translation without id');
    }

    const persistence = translation.toPersistence();

    const updatedTranslation = await this.tx.gameTranslation.update({
      where: { id: translation.id },
      data: {
        providerName: persistence.providerName,
        categoryName: persistence.categoryName,
        gameName: persistence.gameName,
      },
    });

    return GameTranslation.fromPersistence({
      id: updatedTranslation.id,
      uid: updatedTranslation.uid,
      gameId: updatedTranslation.gameId,
      language: updatedTranslation.language,
      providerName: updatedTranslation.providerName,
      categoryName: updatedTranslation.categoryName,
      gameName: updatedTranslation.gameName,
      createdAt: updatedTranslation.createdAt,
      updatedAt: updatedTranslation.updatedAt,
    });
  }

  async createTranslation(translation: GameTranslation): Promise<GameTranslation> {
    if (translation.id !== null) {
      throw new Error('Cannot create translation with existing id');
    }

    const persistence = translation.toPersistence();

    const createdTranslation = await this.tx.gameTranslation.create({
      data: {
        uid: persistence.uid,
        gameId: persistence.gameId,
        language: persistence.language,
        providerName: persistence.providerName,
        categoryName: persistence.categoryName,
        gameName: persistence.gameName,
      },
    });

    return GameTranslation.fromPersistence({
      id: createdTranslation.id,
      uid: createdTranslation.uid,
      gameId: createdTranslation.gameId,
      language: createdTranslation.language,
      providerName: createdTranslation.providerName,
      categoryName: createdTranslation.categoryName,
      gameName: createdTranslation.gameName,
      createdAt: createdTranslation.createdAt,
      updatedAt: createdTranslation.updatedAt,
    });
  }
}


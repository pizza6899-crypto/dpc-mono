import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GameRepositoryPort, GameListOptions } from '../ports';
import { CasinoGame, GameNotFoundException } from '../domain';
import { GameMapper } from './game.mapper';

@Injectable()
export class GameRepository implements GameRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: GameMapper,
  ) {}

  async findById(id: bigint): Promise<CasinoGame | null> {
    const result = await this.tx.casinoGame.findUnique({
      where: { id },
      include: { translations: true },
    });
    return result ? this.mapper.toDomain(result as any) : null;
  }

  async getById(id: bigint): Promise<CasinoGame> {
    const game = await this.findById(id);
    if (!game) throw new GameNotFoundException(id);
    return game;
  }

  async findByExternalId(
    providerId: bigint,
    externalGameId: string,
  ): Promise<CasinoGame | null> {
    const result = await this.tx.casinoGame.findUnique({
      where: {
        providerId_externalGameId: {
          providerId,
          externalGameId,
        },
      },
      include: { translations: true },
    });
    return result ? this.mapper.toDomain(result as any) : null;
  }

  async getByExternalId(
    providerId: bigint,
    externalGameId: string,
  ): Promise<CasinoGame> {
    const game = await this.findByExternalId(providerId, externalGameId);
    if (!game)
      throw new GameNotFoundException(`${providerId}:${externalGameId}`);
    return game;
  }

  async list(options?: GameListOptions): Promise<CasinoGame[]> {
    const where = this.buildWhere(options);

    const result = await this.tx.casinoGame.findMany({
      where,
      include: { translations: true },
      orderBy: { sortOrder: 'asc' },
      take: options?.limit,
      skip: options?.offset,
    });
    return result.map((r) => this.mapper.toDomain(r as any));
  }

  async count(options?: GameListOptions): Promise<number> {
    const where = this.buildWhere(options);
    return await this.tx.casinoGame.count({ where });
  }

  private buildWhere(options?: GameListOptions): any {
    const where: any = {};
    if (options?.providerId) where.providerId = options.providerId;
    if (options?.providerCode) {
      where.provider = {
        code: options.providerCode,
      };
    }
    if (options?.isEnabled !== undefined) where.isEnabled = options.isEnabled;
    if (options?.isVisible !== undefined) where.isVisible = options.isVisible;

    // 카테고리 필터
    if (options?.categoryId) {
      where.categoryItems = {
        some: { categoryId: options.categoryId },
      };
    }

    // 키워드(게임 이름) 검색
    if (options?.keyword) {
      where.translations = {
        some: {
          name: {
            contains: options.keyword,
            mode: 'insensitive',
          },
        },
      };
    }

    return where;
  }

  async create(game: CasinoGame): Promise<CasinoGame> {
    const data = this.mapper.toPrisma(game);
    const translations = this.mapper.toPrismaTranslations(game);

    const result = await this.tx.casinoGame.create({
      data: {
        ...data,
        translations: {
          create: translations,
        },
      },
      include: { translations: true },
    });

    return this.mapper.toDomain(result as any);
  }

  async update(game: CasinoGame): Promise<CasinoGame> {
    if (!game.id) throw new Error('Game ID is required for update');

    const data = this.mapper.toPrisma(game);
    const translations = this.mapper.toPrismaTranslations(game);

    await this.tx.casinoGameTranslation.deleteMany({
      where: { gameId: game.id },
    });

    const result = await this.tx.casinoGame.update({
      where: { id: game.id },
      data: {
        ...data,
        translations: {
          create: translations,
        },
      },
      include: { translations: true },
    });

    return this.mapper.toDomain(result as any);
  }
}

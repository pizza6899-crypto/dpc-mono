import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { GameRepositoryPort, GameListOptions } from '../ports';
import { CasinoGameV2, GameNotFoundException } from '../domain';
import { GameMapper } from './game.mapper';

@Injectable()
export class GameRepository implements GameRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: GameMapper,
    ) { }

    async findById(id: bigint): Promise<CasinoGameV2 | null> {
        const result = await this.tx.casinoGameV2.findUnique({
            where: { id },
            include: { translations: true },
        });
        return result ? this.mapper.toDomain(result as any) : null;
    }

    async getById(id: bigint): Promise<CasinoGameV2> {
        const game = await this.findById(id);
        if (!game) throw new GameNotFoundException(id);
        return game;
    }

    async findByExternalId(providerId: bigint, externalGameId: string): Promise<CasinoGameV2 | null> {
        const result = await this.tx.casinoGameV2.findUnique({
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

    async getByExternalId(providerId: bigint, externalGameId: string): Promise<CasinoGameV2> {
        const game = await this.findByExternalId(providerId, externalGameId);
        if (!game) throw new GameNotFoundException(`${providerId}:${externalGameId}`);
        return game;
    }

    async list(options?: GameListOptions): Promise<CasinoGameV2[]> {
        const where: any = {};
        if (options?.providerId) where.providerId = options.providerId;
        if (options?.isEnabled !== undefined) where.isEnabled = options.isEnabled;
        if (options?.isVisible !== undefined) where.isVisible = options.isVisible;
        if (options?.categoryId) {
            where.categoryItems = {
                some: { categoryId: options.categoryId },
            };
        }

        const result = await this.tx.casinoGameV2.findMany({
            where,
            include: { translations: true },
            orderBy: { sortOrder: 'asc' },
            take: options?.limit,
            skip: options?.offset,
        });
        return result.map((r) => this.mapper.toDomain(r as any));
    }

    async count(options?: GameListOptions): Promise<number> {
        const where: any = {};
        if (options?.providerId) where.providerId = options.providerId;
        if (options?.isEnabled !== undefined) where.isEnabled = options.isEnabled;
        if (options?.isVisible !== undefined) where.isVisible = options.isVisible;
        if (options?.categoryId) {
            where.categoryItems = {
                some: { categoryId: options.categoryId },
            };
        }

        return await this.tx.casinoGameV2.count({ where });
    }

    async create(game: CasinoGameV2): Promise<CasinoGameV2> {
        const data = this.mapper.toPrisma(game);
        const translations = this.mapper.toPrismaTranslations(game);

        const result = await this.tx.casinoGameV2.create({
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

    async update(game: CasinoGameV2): Promise<CasinoGameV2> {
        if (!game.id) throw new Error('Game ID is required for update');

        const data = this.mapper.toPrisma(game);
        const translations = this.mapper.toPrismaTranslations(game);

        await this.tx.casinoGameV2Translation.deleteMany({
            where: { gameId: game.id },
        });

        const result = await this.tx.casinoGameV2.update({
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

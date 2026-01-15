import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { CasinoGameRepositoryPort, FindCasinoGamesOptions } from '../ports/casino-game.repository.port';
import { CasinoGame } from '../domain/model/casino-game.entity';
import { CasinoGameMapper } from './casino-game.mapper';
import { Language, Prisma } from '@repo/database';

@Injectable()
export class CasinoGameRepository implements CasinoGameRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: CasinoGameMapper,
    ) { }

    async findById(id: number, language?: Language): Promise<CasinoGame | null> {
        const result = await this.tx.casinoGame.findUnique({
            where: { id },
            include: {
                translations: language ? { where: { language } } : true,
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async getById(id: number, language?: Language): Promise<CasinoGame> {
        const game = await this.findById(id, language);
        if (!game) throw new Error(`Casino game not found: ${id}`);
        return game;
    }

    async findMany(options: FindCasinoGamesOptions): Promise<{ data: CasinoGame[]; total: number }> {
        const {
            category,
            provider,
            keyword,
            isEnabled,
            isVisibleToUser,
            language = Language.EN,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = options;

        const skip = (page - 1) * limit;

        const where: Prisma.CasinoGameWhereInput = {
            ...(isEnabled !== undefined && { isEnabled }),
            ...(isVisibleToUser !== undefined && { isVisibleToUser }),
            ...(category && category.length > 0 && { category: { in: category } }),
            ...(provider && provider.length > 0 && { provider: { in: provider } }),
            ...(keyword && {
                translations: {
                    some: {
                        gameName: { contains: keyword, mode: 'insensitive' },
                        language,
                    },
                },
            }),
        };

        const [items, total] = await Promise.all([
            this.tx.casinoGame.findMany({
                where,
                include: {
                    translations: { where: { language } },
                },
                orderBy: { [sortBy]: sortOrder },
                skip,
                take: limit,
            }),
            this.tx.casinoGame.count({ where }),
        ]);

        return {
            data: items.map(item => this.mapper.toDomain(item)),
            total,
        };
    }

    async update(id: number, data: Partial<{ isEnabled: boolean; isVisibleToUser: boolean; iconLink: string }>): Promise<CasinoGame> {
        const result = await this.tx.casinoGame.update({
            where: { id },
            data,
        });
        return this.mapper.toDomain(result);
    }
}

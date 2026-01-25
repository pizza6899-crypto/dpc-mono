import { Inject, Injectable } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports';
import type { GameRepositoryPort } from '../ports';
import { CasinoGame } from '../domain';
import { Language, Prisma } from '@prisma/client';

interface UpdateGameParams {
    id: bigint;
    thumbnailUrl?: string | null;
    bannerUrl?: string | null;
    rtp?: Prisma.Decimal | null;
    volatility?: string | null;
    gameType?: string | null;
    tableId?: string | null;
    tags?: string[];
    houseEdge?: Prisma.Decimal;
    contributionRate?: Prisma.Decimal;
    sortOrder?: number;
    isEnabled?: boolean;
    isVisible?: boolean;
    translations?: {
        language: Language;
        name: string;
    }[];
}

@Injectable()
export class UpdateGameService {
    constructor(
        @Inject(GAME_REPOSITORY)
        private readonly repository: GameRepositoryPort,
    ) { }

    async execute(params: UpdateGameParams): Promise<CasinoGame> {
        const game = await this.repository.getById(params.id);

        game.update({
            thumbnailUrl: params.thumbnailUrl,
            bannerUrl: params.bannerUrl,
            rtp: params.rtp,
            volatility: params.volatility,
            gameType: params.gameType,
            tableId: params.tableId,
            tags: params.tags,
            houseEdge: params.houseEdge,
            contributionRate: params.contributionRate,
            sortOrder: params.sortOrder,
            isEnabled: params.isEnabled,
            isVisible: params.isVisible,
            translations: params.translations,
        });

        return await this.repository.update(game);
    }
}

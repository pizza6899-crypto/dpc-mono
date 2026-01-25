import { Inject, Injectable } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports';
import type { GameRepositoryPort } from '../ports';
import { CasinoGame } from '../domain';
import { Language, Prisma } from '@prisma/client';

interface CreateGameParams {
    providerId: bigint;
    externalGameId: string;
    code: string;
    thumbnailUrl?: string;
    bannerUrl?: string;
    rtp?: Prisma.Decimal;
    volatility?: string;
    gameType?: string;
    tableId?: string;
    tags?: string[];
    houseEdge?: Prisma.Decimal;
    contributionRate?: Prisma.Decimal;
    sortOrder?: number;
    isEnabled?: boolean;
    isVisible?: boolean;
    translations: {
        language: Language;
        name: string;
    }[];
}

@Injectable()
export class CreateGameService {
    constructor(
        @Inject(GAME_REPOSITORY)
        private readonly repository: GameRepositoryPort,
    ) { }

    async execute(params: CreateGameParams): Promise<CasinoGame> {
        // Optional: check if existsByExternalId
        const game = CasinoGame.create(params);
        return await this.repository.create(game);
    }
}

import { Inject, Injectable } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports';
import type { GameRepositoryPort } from '../ports';
import type { CasinoGame } from '../domain';
import { PaginatedData } from 'src/common/http/types';

interface FindGamesParams {
    providerId?: bigint;
    providerCode?: string;
    categoryId?: bigint;
    keyword?: string;
    isEnabled?: boolean;
    isVisible?: boolean;
    page?: number;
    limit?: number;
}

@Injectable()
export class FindGamesService {
    constructor(
        @Inject(GAME_REPOSITORY)
        private readonly repository: GameRepositoryPort,
    ) { }

    async execute({ page = 1, limit = 20, ...options }: FindGamesParams = {}): Promise<PaginatedData<CasinoGame>> {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.repository.list({ ...options, limit, offset }),
            this.repository.count(options),
        ]);

        return {
            data,
            page,
            limit,
            total,
        };
    }
}

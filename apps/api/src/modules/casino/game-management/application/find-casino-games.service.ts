import { Inject, Injectable } from '@nestjs/common';
import { CASINO_GAME_REPOSITORY } from '../ports/casino-game.repository.token';
import type { CasinoGameRepositoryPort, FindCasinoGamesOptions } from '../ports/casino-game.repository.port';
import { CasinoGame } from '../domain/model/casino-game.entity';

@Injectable()
export class FindCasinoGamesService {
    constructor(
        @Inject(CASINO_GAME_REPOSITORY)
        private readonly repository: CasinoGameRepositoryPort,
    ) { }

    async execute(options: FindCasinoGamesOptions): Promise<{ data: CasinoGame[]; total: number; page: number; limit: number }> {
        const result = await this.repository.findMany(options);
        return {
            ...result,
            page: options.page || 1,
            limit: options.limit || 20,
        };
    }
}

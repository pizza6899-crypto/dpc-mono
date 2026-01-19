import { Inject, Injectable } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports';
import type { GameRepositoryPort, GameListOptions } from '../ports';
import type { CasinoGameV2 } from '../domain';

@Injectable()
export class FindGamesService {
    constructor(
        @Inject(GAME_REPOSITORY)
        private readonly repository: GameRepositoryPort,
    ) { }

    async execute(options: GameListOptions = {}): Promise<CasinoGameV2[]> {
        return await this.repository.list(options);
    }
}

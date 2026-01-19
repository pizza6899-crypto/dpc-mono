import { Inject, Injectable } from '@nestjs/common';
import { GAME_REPOSITORY } from '../ports';
import type { GameRepositoryPort } from '../ports';
import { CasinoGameV2 } from '../domain';

@Injectable()
export class FindGameByIdService {
    constructor(
        @Inject(GAME_REPOSITORY)
        private readonly repository: GameRepositoryPort,
    ) { }

    async execute(id: bigint): Promise<CasinoGameV2> {
        return await this.repository.getById(id);
    }
}

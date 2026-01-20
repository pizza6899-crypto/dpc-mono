import { Inject, Injectable } from '@nestjs/common';
import { CasinoGameProvider } from '../../domain';
import { CASINO_GAME_PROVIDER_REPOSITORY } from '../../ports/casino-game-provider.repository.token';
import { type CasinoGameProviderRepositoryPort } from '../../ports/casino-game-provider.repository.port';

interface FindGameProviderByIdParams {
    id: bigint;
}

@Injectable()
export class FindGameProviderByIdService {
    constructor(
        @Inject(CASINO_GAME_PROVIDER_REPOSITORY)
        private readonly repository: CasinoGameProviderRepositoryPort,
    ) { }

    async execute({ id }: FindGameProviderByIdParams): Promise<CasinoGameProvider> {
        return await this.repository.getById(id);
    }
}

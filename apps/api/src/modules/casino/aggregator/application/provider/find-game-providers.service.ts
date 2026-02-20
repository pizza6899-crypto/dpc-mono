import { Inject, Injectable } from '@nestjs/common';
import { CasinoGameProvider } from '../../domain';
import { CASINO_GAME_PROVIDER_REPOSITORY } from '../../ports/casino-game-provider.repository.token';
import {
  type CasinoGameProviderRepositoryPort,
  ListProvidersOptions,
} from '../../ports/casino-game-provider.repository.port';

@Injectable()
export class FindGameProvidersService {
  constructor(
    @Inject(CASINO_GAME_PROVIDER_REPOSITORY)
    private readonly repository: CasinoGameProviderRepositoryPort,
  ) {}

  async execute(options?: ListProvidersOptions): Promise<CasinoGameProvider[]> {
    return await this.repository.list(options);
  }
}

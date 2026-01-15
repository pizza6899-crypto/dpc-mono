import { Inject, Injectable } from '@nestjs/common';
import { CASINO_GAME_REPOSITORY } from '../ports/casino-game.repository.token';
import { type CasinoGameRepositoryPort } from '../ports/casino-game.repository.port';
import { CasinoGame } from '../domain/model/casino-game.entity';
import { Transactional } from '@nestjs-cls/transactional';

interface UpdateCasinoGameParams {
  id: number;
  isEnabled?: boolean;
  isVisibleToUser?: boolean;
  iconLink?: string;
}

@Injectable()
export class UpdateCasinoGameService {
  constructor(
    @Inject(CASINO_GAME_REPOSITORY)
    private readonly repository: CasinoGameRepositoryPort,
  ) { }

  @Transactional()
  async execute({ id, ...data }: UpdateCasinoGameParams): Promise<CasinoGame> {
    // Check if exists
    await this.repository.getById(id);
    return await this.repository.update(id, data);
  }
}

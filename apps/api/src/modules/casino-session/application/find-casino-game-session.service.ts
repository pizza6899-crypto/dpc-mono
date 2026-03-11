import { Inject, Injectable } from '@nestjs/common';
import { GameAggregatorType } from '@prisma/client';
import { CASINO_GAME_SESSION_REPOSITORY } from '../ports/casino-game-session.repository.token';
import type { CasinoGameSessionRepositoryPort } from '../ports/casino-game-session.repository.port';
import { CasinoGameSession, CasinoGameSessionNotFoundException } from '../domain';

@Injectable()
export class FindCasinoGameSessionService {
  constructor(
    @Inject(CASINO_GAME_SESSION_REPOSITORY)
    private readonly repository: CasinoGameSessionRepositoryPort,
  ) { }

  async findByToken(token: string): Promise<CasinoGameSession | null> {
    return await this.repository.findByToken(token);
  }

  async getByToken(token: string): Promise<CasinoGameSession> {
    const session = await this.repository.findByToken(token);
    if (!session) {
      throw new CasinoGameSessionNotFoundException(token);
    }
    return session;
  }

  async findByid(id: bigint): Promise<CasinoGameSession | null> {
    return await this.repository.findByid(id);
  }

  async findRecent(
    userId: bigint,
    aggregatorType: GameAggregatorType,
  ): Promise<CasinoGameSession | null> {
    return await this.repository.findRecentByUserId(userId, aggregatorType);
  }

  async findRecentByPlayerName(
    playerName: string,
    aggregatorType: GameAggregatorType,
  ): Promise<CasinoGameSession | null> {
    return await this.repository.findRecentByPlayerName(
      playerName,
      aggregatorType,
    );
  }
}

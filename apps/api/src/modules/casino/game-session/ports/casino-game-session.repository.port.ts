import type { CasinoGameSession } from '../domain';

export interface CasinoGameSessionRepositoryPort {
  create(session: CasinoGameSession): Promise<CasinoGameSession>;
  findByToken(token: string): Promise<CasinoGameSession | null>;
  findByid(id: bigint): Promise<CasinoGameSession | null>;
  findRecentByUserId(
    userId: bigint,
    aggregatorType: string,
  ): Promise<CasinoGameSession | null>;
  findRecentByPlayerName(
    playerName: string,
    aggregatorType: string,
  ): Promise<CasinoGameSession | null>;
  deleteByUserId(userId: bigint): Promise<number>;
}

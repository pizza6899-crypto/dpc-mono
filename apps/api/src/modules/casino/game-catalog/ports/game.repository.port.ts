import type { CasinoGame } from '../domain';

export interface GameListOptions {
  providerId?: bigint;
  providerCode?: string; // 프로바이더 코드로 필터링 추가
  categoryId?: bigint;
  keyword?: string; // 검색 키워드 추가
  isEnabled?: boolean;
  isVisible?: boolean;
  limit?: number;
  offset?: number;
}

export interface GameRepositoryPort {
  findById(id: bigint): Promise<CasinoGame | null>;
  getById(id: bigint): Promise<CasinoGame>;
  findByExternalId(
    providerId: bigint,
    externalGameId: string,
  ): Promise<CasinoGame | null>;
  getByExternalId(
    providerId: bigint,
    externalGameId: string,
  ): Promise<CasinoGame>;
  list(options?: GameListOptions): Promise<CasinoGame[]>;
  count(options?: GameListOptions): Promise<number>;
  create(game: CasinoGame): Promise<CasinoGame>;
  update(game: CasinoGame): Promise<CasinoGame>;
}

export const GAME_REPOSITORY = Symbol('GAME_REPOSITORY');

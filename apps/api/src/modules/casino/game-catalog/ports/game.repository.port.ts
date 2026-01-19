import { CasinoGameV2 } from '../domain';

export interface GameListOptions {
    providerId?: bigint;
    categoryId?: bigint;
    keyword?: string; // 검색 키워드 추가
    isEnabled?: boolean;
    isVisible?: boolean;
    limit?: number;
    offset?: number;
}

export interface GameRepositoryPort {
    findById(id: bigint): Promise<CasinoGameV2 | null>;
    getById(id: bigint): Promise<CasinoGameV2>;
    findByExternalId(providerId: bigint, externalGameId: string): Promise<CasinoGameV2 | null>;
    getByExternalId(providerId: bigint, externalGameId: string): Promise<CasinoGameV2>;
    list(options?: GameListOptions): Promise<CasinoGameV2[]>;
    count(options?: GameListOptions): Promise<number>;
    create(game: CasinoGameV2): Promise<CasinoGameV2>;
    update(game: CasinoGameV2): Promise<CasinoGameV2>;
}

export const GAME_REPOSITORY = Symbol('GAME_REPOSITORY');

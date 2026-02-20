import type { CasinoGameCategory } from '../domain';

export interface CategoryListOptions {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface CategoryRepositoryPort {
  findById(id: bigint): Promise<CasinoGameCategory | null>;
  getById(id: bigint): Promise<CasinoGameCategory>;
  findByCode(code: string): Promise<CasinoGameCategory | null>;
  getByCode(code: string): Promise<CasinoGameCategory>;
  list(options?: CategoryListOptions): Promise<CasinoGameCategory[]>;
  count(options?: CategoryListOptions): Promise<number>;
  create(category: CasinoGameCategory): Promise<CasinoGameCategory>;
  update(category: CasinoGameCategory): Promise<CasinoGameCategory>;
  delete(id: bigint): Promise<void>;
  addGames(categoryId: bigint, gameIds: bigint[]): Promise<void>;
  removeGames(categoryId: bigint, gameIds: bigint[]): Promise<void>;
}

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

import { CasinoGameCategory } from '../domain';

export interface CategoryRepositoryPort {
    findById(id: bigint): Promise<CasinoGameCategory | null>;
    getById(id: bigint): Promise<CasinoGameCategory>;
    findByCode(code: string): Promise<CasinoGameCategory | null>;
    getByCode(code: string): Promise<CasinoGameCategory>;
    list(options?: { isActive?: boolean }): Promise<CasinoGameCategory[]>;
    create(category: CasinoGameCategory): Promise<CasinoGameCategory>;
    update(category: CasinoGameCategory): Promise<CasinoGameCategory>;
    delete(id: bigint): Promise<void>;
}

export const CATEGORY_REPOSITORY = Symbol('CATEGORY_REPOSITORY');

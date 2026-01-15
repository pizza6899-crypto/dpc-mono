import { CasinoGame } from '../domain/model/casino-game.entity';
import { GameCategory, GameProvider, Language } from '@repo/database';

export interface FindCasinoGamesOptions {
    category?: GameCategory[];
    provider?: GameProvider[];
    keyword?: string;
    isEnabled?: boolean;
    isVisibleToUser?: boolean;
    language?: Language;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CasinoGameRepositoryPort {
    findById(id: number, language?: Language): Promise<CasinoGame | null>;
    getById(id: number, language?: Language): Promise<CasinoGame>;
    findMany(options: FindCasinoGamesOptions): Promise<{ data: CasinoGame[], total: number }>;
    update(id: number, data: Partial<{ isEnabled: boolean, isVisibleToUser: boolean, iconLink: string }>): Promise<CasinoGame>;
}

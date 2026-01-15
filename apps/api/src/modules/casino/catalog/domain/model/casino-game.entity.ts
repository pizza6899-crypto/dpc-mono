import { GameAggregatorType, GameCategory, GameProvider, Prisma } from '@repo/database';

export class CasinoGame {
    private constructor(
        public readonly id: number,
        private _aggregatorType: GameAggregatorType,
        private _provider: GameProvider,
        private _category: GameCategory,
        private _isEnabled: boolean,
        private _isVisibleToUser: boolean,
        private _iconLink: string | null,
        private _createdAt: Date,
        private _updatedAt: Date,
        private _translations?: CasinoGameTranslation[],
    ) { }

    static create(params: {
        id: number;
        aggregatorType: GameAggregatorType;
        provider: GameProvider;
        category: GameCategory;
        isEnabled: boolean;
        isVisibleToUser: boolean;
        iconLink: string | null;
        createdAt: Date;
        updatedAt: Date;
        translations?: CasinoGameTranslation[];
    }): CasinoGame {
        return new CasinoGame(
            params.id,
            params.aggregatorType,
            params.provider,
            params.category,
            params.isEnabled,
            params.isVisibleToUser,
            params.iconLink,
            params.createdAt,
            params.updatedAt,
            params.translations,
        );
    }

    get aggregatorType() { return this._aggregatorType; }
    get provider() { return this._provider; }
    get category() { return this._category; }
    get isEnabled() { return this._isEnabled; }
    get isVisibleToUser() { return this._isVisibleToUser; }
    get iconLink() { return this._iconLink; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    get translations() { return this._translations || []; }

    updateStatus(isEnabled?: boolean, isVisibleToUser?: boolean): CasinoGame {
        return new CasinoGame(
            this.id,
            this._aggregatorType,
            this._provider,
            this._category,
            isEnabled ?? this._isEnabled,
            isVisibleToUser ?? this._isVisibleToUser,
            this._iconLink,
            this._createdAt,
            new Date(),
            this._translations,
        );
    }
}

export interface CasinoGameTranslation {
    language: string;
    gameName: string;
    categoryName?: string;
}

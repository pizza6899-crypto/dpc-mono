import { CategoryType, Language, Prisma } from "@repo/database";

export interface CategoryTranslation {
    language: Language;
    name: string;
    description?: string | null;
}

export class CasinoGameCategory {
    private constructor(
        public readonly id: bigint | null,
        private _code: string,
        private _type: CategoryType,
        private _iconUrl: string | null,
        private _bannerUrl: string | null,
        private _sortOrder: number,
        private _isActive: boolean,
        private _isSystem: boolean,
        private _autoPopulate: boolean,
        private _autoRule: Prisma.JsonValue | null,
        private _translations: CategoryTranslation[],
    ) { }

    static create(params: {
        id?: bigint;
        code: string;
        type: CategoryType;
        iconUrl?: string | null;
        bannerUrl?: string | null;
        sortOrder?: number;
        isActive?: boolean;
        isSystem?: boolean;
        autoPopulate?: boolean;
        autoRule?: Prisma.JsonValue | null;
        translations: CategoryTranslation[];
    }): CasinoGameCategory {
        return new CasinoGameCategory(
            params.id ?? null,
            params.code,
            params.type,
            params.iconUrl ?? null,
            params.bannerUrl ?? null,
            params.sortOrder ?? 0,
            params.isActive ?? true,
            params.isSystem ?? false,
            params.autoPopulate ?? false,
            params.autoRule ?? null,
            params.translations,
        );
    }

    get code(): string { return this._code; }
    get type(): CategoryType { return this._type; }
    get iconUrl(): string | null { return this._iconUrl; }
    get bannerUrl(): string | null { return this._bannerUrl; }
    get sortOrder(): number { return this._sortOrder; }
    get isActive(): boolean { return this._isActive; }
    get isSystem(): boolean { return this._isSystem; }
    get autoPopulate(): boolean { return this._autoPopulate; }
    get autoRule(): Prisma.JsonValue | null { return this._autoRule; }
    get translations(): CategoryTranslation[] { return this._translations; }

    update(params: Partial<{
        iconUrl: string | null;
        bannerUrl: string | null;
        sortOrder: number;
        isActive: boolean;
        autoPopulate: boolean;
        autoRule: Prisma.JsonValue | null;
        translations: CategoryTranslation[];
    }>): void {
        if (params.iconUrl !== undefined) this._iconUrl = params.iconUrl;
        if (params.bannerUrl !== undefined) this._bannerUrl = params.bannerUrl;
        if (params.sortOrder !== undefined) this._sortOrder = params.sortOrder;
        if (params.isActive !== undefined) this._isActive = params.isActive;
        if (params.autoPopulate !== undefined) this._autoPopulate = params.autoPopulate;
        if (params.autoRule !== undefined) this._autoRule = params.autoRule;
        if (params.translations !== undefined) this._translations = params.translations;
    }
}

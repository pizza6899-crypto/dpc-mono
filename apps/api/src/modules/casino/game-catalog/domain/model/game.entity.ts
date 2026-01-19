import { Language, Prisma } from "@repo/database";

export interface GameTranslation {
    language: Language;
    name: string;
}

export class CasinoGameV2 {
    private constructor(
        public readonly id: bigint | null,
        private _providerId: bigint,
        private _externalGameId: string,
        private _code: string,
        private _thumbnailUrl: string | null,
        private _bannerUrl: string | null,
        private _rtp: Prisma.Decimal | null,
        private _volatility: string | null,
        private _gameType: string | null,
        private _tableId: string | null,
        private _tags: string[],
        private _houseEdge: Prisma.Decimal,
        private _contributionRate: Prisma.Decimal,
        private _sortOrder: number,
        private _isEnabled: boolean,
        private _isVisible: boolean,
        private _translations: GameTranslation[],
    ) { }

    static create(params: {
        id?: bigint;
        providerId: bigint;
        externalGameId: string;
        code: string;
        thumbnailUrl?: string | null;
        bannerUrl?: string | null;
        rtp?: Prisma.Decimal | null;
        volatility?: string | null;
        gameType?: string | null;
        tableId?: string | null;
        tags?: string[];
        houseEdge?: Prisma.Decimal;
        contributionRate?: Prisma.Decimal;
        sortOrder?: number;
        isEnabled?: boolean;
        isVisible?: boolean;
        translations: GameTranslation[];
    }): CasinoGameV2 {
        return new CasinoGameV2(
            params.id ?? null,
            params.providerId,
            params.externalGameId,
            params.code,
            params.thumbnailUrl ?? null,
            params.bannerUrl ?? null,
            params.rtp ?? null,
            params.volatility ?? null,
            params.gameType ?? null,
            params.tableId ?? null,
            params.tags ?? [],
            params.houseEdge ?? new Prisma.Decimal(0.04),
            params.contributionRate ?? new Prisma.Decimal(1.0),
            params.sortOrder ?? 0,
            params.isEnabled ?? true,
            params.isVisible ?? true,
            params.translations,
        );
    }

    get providerId(): bigint { return this._providerId; }
    get externalGameId(): string { return this._externalGameId; }
    get code(): string { return this._code; }
    get thumbnailUrl(): string | null { return this._thumbnailUrl; }
    get bannerUrl(): string | null { return this._bannerUrl; }
    get rtp(): Prisma.Decimal | null { return this._rtp; }
    get volatility(): string | null { return this._volatility; }
    get gameType(): string | null { return this._gameType; }
    get tableId(): string | null { return this._tableId; }
    get tags(): string[] { return this._tags; }
    get houseEdge(): Prisma.Decimal { return this._houseEdge; }
    get contributionRate(): Prisma.Decimal { return this._contributionRate; }
    get sortOrder(): number { return this._sortOrder; }
    get isEnabled(): boolean { return this._isEnabled; }
    get isVisible(): boolean { return this._isVisible; }
    get translations(): GameTranslation[] { return this._translations; }

    update(params: Partial<{
        thumbnailUrl: string | null;
        bannerUrl: string | null;
        rtp: Prisma.Decimal | null;
        volatility: string | null;
        gameType: string | null;
        tableId: string | null;
        tags: string[];
        houseEdge: Prisma.Decimal;
        contributionRate: Prisma.Decimal;
        sortOrder: number;
        isEnabled: boolean;
        isVisible: boolean;
        translations: GameTranslation[];
    }>): void {
        if (params.thumbnailUrl !== undefined) this._thumbnailUrl = params.thumbnailUrl;
        if (params.bannerUrl !== undefined) this._bannerUrl = params.bannerUrl;
        if (params.rtp !== undefined) this._rtp = params.rtp;
        if (params.volatility !== undefined) this._volatility = params.volatility;
        if (params.gameType !== undefined) this._gameType = params.gameType;
        if (params.tableId !== undefined) this._tableId = params.tableId;
        if (params.tags !== undefined) this._tags = params.tags;
        if (params.houseEdge !== undefined) this._houseEdge = params.houseEdge;
        if (params.contributionRate !== undefined) this._contributionRate = params.contributionRate;
        if (params.sortOrder !== undefined) this._sortOrder = params.sortOrder;
        if (params.isEnabled !== undefined) this._isEnabled = params.isEnabled;
        if (params.isVisible !== undefined) this._isVisible = params.isVisible;
        if (params.translations !== undefined) this._translations = params.translations;
    }
}

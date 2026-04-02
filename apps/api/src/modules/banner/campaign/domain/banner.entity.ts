import type { Language } from '@prisma/client';

export interface BannerTranslation {
  id?: bigint | null;
  language: Language;
  isActive: boolean;
  imageUrl?: string | null;
  title?: string | null;
  altText?: string | null;
  linkUrl?: string | null;
}

export class Banner {
  private constructor(
    public readonly id: bigint | null,
    private _name: string | null,
    private _isActive: boolean,
    private _order: number,
    private _linkUrl: string | null,
    private _startDate: Date | null,
    private _endDate: Date | null,
    private _deletedAt: Date | null,
    private _translations: BannerTranslation[],
    private _createdAt: Date | null,
    private _updatedAt: Date | null,
  ) {}

  static create(params: {
    id?: bigint;
    name?: string | null;
    isActive?: boolean;
    order?: number;
    linkUrl?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
    deletedAt?: Date | null;
    translations?: BannerTranslation[];
    createdAt?: Date | null;
    updatedAt?: Date | null;
  }): Banner {
    return new Banner(
      params.id ?? null,
      params.name ?? null,
      params.isActive ?? true,
      params.order ?? 0,
      params.linkUrl ?? null,
      params.startDate ?? null,
      params.endDate ?? null,
      params.deletedAt ?? null,
      params.translations ?? [],
      params.createdAt ?? null,
      params.updatedAt ?? null,
    );
  }

  get name(): string | null {
    return this._name;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get order(): number {
    return this._order;
  }

  get linkUrl(): string | null {
    return this._linkUrl;
  }

  get startDate(): Date | null {
    return this._startDate;
  }

  get endDate(): Date | null {
    return this._endDate;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  get translations(): BannerTranslation[] {
    return this._translations;
  }

  get createdAt(): Date | null {
    return this._createdAt;
  }

  get updatedAt(): Date | null {
    return this._updatedAt;
  }

  update(params: Partial<{
    name: string | null;
    isActive: boolean;
    order: number;
    linkUrl: string | null;
    startDate: Date | null;
    endDate: Date | null;
    deletedAt: Date | null;
    translations: BannerTranslation[];
  }>): void {
    if (params.name !== undefined) this._name = params.name;
    if (params.isActive !== undefined) this._isActive = params.isActive;
    if (params.order !== undefined) this._order = params.order;
    if (params.linkUrl !== undefined) this._linkUrl = params.linkUrl;
    if (params.startDate !== undefined) this._startDate = params.startDate;
    if (params.endDate !== undefined) this._endDate = params.endDate;
    if (params.deletedAt !== undefined) this._deletedAt = params.deletedAt;
    if (params.translations !== undefined) this._translations = params.translations;
  }
}

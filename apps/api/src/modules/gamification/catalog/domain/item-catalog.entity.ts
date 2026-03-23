import type { EffectType, ExchangeCurrencyCode, ItemType, Language } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { MessageCode } from '@repo/shared';
import { InvalidItemParameterException } from './catalog.exception';

/**
 * 아이템의 효과 상세 정의 인터페이스
 */
export interface ItemEffect {
  type: EffectType;
  value: number; // 수치 (%, 포인트 등)
  target?: string; // 대상 (예: STAT_BOOST의 경우 'STR', 'LUC' 등)
}

/**
 * 아이템 다국어 번역 정보 인터페이스
 */
export interface ItemTranslation {
  language: Language;
  name: string;
  description: string | null;
}

/**
 * [Gamification] 아이템 카탈로그 도메인 엔티티
 */
export class ItemCatalog {
  private constructor(
    private _code: string,
    private _type: ItemType,
    private _effects: ItemEffect[],
    private _price: Prisma.Decimal,
    private _priceCurrency: ExchangeCurrencyCode,
    private _durationDays: number | null,
    private _translations: ItemTranslation[],
    private readonly _id: bigint = 0n,
    private readonly _createdAt: Date = new Date(),
    private _updatedAt: Date = new Date(),
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    id: bigint;
    code: string;
    type: ItemType;
    effects: any;
    price: Prisma.Decimal;
    priceCurrency: ExchangeCurrencyCode;
    durationDays: number | null;
    createdAt: Date;
    updatedAt: Date;
    translations: ItemTranslation[];
  }): ItemCatalog {
    return new ItemCatalog(
      data.code,
      data.type,
      data.effects as ItemEffect[],
      data.price,
      data.priceCurrency,
      data.durationDays,
      data.translations,
      data.id,
      data.createdAt,
      data.updatedAt,
    );
  }

  /**
   * 새로운 아이템 생성
   */
  static create(params: {
    code: string;
    type: ItemType;
    effects: ItemEffect[];
    price: Prisma.Decimal;
    priceCurrency?: ExchangeCurrencyCode;
    durationDays?: number | null;
    translations: ItemTranslation[];
  }): ItemCatalog {
    const item = new ItemCatalog(
      params.code,
      params.type,
      params.effects,
      params.price,
      params.priceCurrency ?? 'USD',
      params.durationDays ?? null,
      params.translations,
    );
    item._validate();
    return item;
  }

  /**
   * 아이템 정보 업데이트
   */
  update(params: {
    code?: string;
    type?: ItemType;
    effects?: ItemEffect[];
    price?: Prisma.Decimal;
    priceCurrency?: ExchangeCurrencyCode;
    durationDays?: number | null;
    translations?: ItemTranslation[];
  }): void {
    if (params.code !== undefined) this._code = params.code;
    if (params.type !== undefined) this._type = params.type;
    if (params.effects !== undefined) this._effects = params.effects;
    if (params.price !== undefined) this._price = params.price;
    if (params.priceCurrency !== undefined) this._priceCurrency = params.priceCurrency;
    if (params.durationDays !== undefined) this._durationDays = params.durationDays;
    if (params.translations !== undefined) this._translations = params.translations;

    this._validate();
    this._updatedAt = new Date();
  }

  /**
   * 도메인 유효성 검사
   */
  private _validate(): void {
    if (!this._code || this._code.trim() === '') {
      throw new InvalidItemParameterException(MessageCode.ITEM_EFFECT_INVALID, 'Item code is required.');
    }

    if (this._price.isNegative()) {
      throw new InvalidItemParameterException(MessageCode.ITEM_PRICE_NEGATIVE, 'Item price cannot be negative.');
    }

    if (this._durationDays !== null && this._durationDays < 0) {
      throw new InvalidItemParameterException(MessageCode.ITEM_DURATION_NEGATIVE, 'Duration days cannot be negative.');
    }

    if (!this._translations || this._translations.length === 0) {
      throw new InvalidItemParameterException(MessageCode.ITEM_TRANSLATION_REQUIRED, 'At least one translation is required.');
    }

    // 효과(Effect) 유효성 기본 체크
    for (const effect of this._effects) {
      if (!effect.type) {
        throw new InvalidItemParameterException(MessageCode.ITEM_EFFECT_INVALID, 'Item effect type is required.');
      }
    }
  }

  /**
   * 특정 언어의 번역 정보 가져오기
   */
  getTranslation(language: Language): ItemTranslation | undefined {
    return this._translations.find((t) => t.language === language);
  }

  /**
   * 기간제 아이템 여부 확인
   */
  isPeriodical(): boolean {
    return this._durationDays !== null && this._durationDays > 0;
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get code(): string { return this._code; }
  get type(): ItemType { return this._type; }
  get effects(): ItemEffect[] { return this._effects; }
  get price(): Prisma.Decimal { return this._price; }
  get priceCurrency(): ExchangeCurrencyCode { return this._priceCurrency; }
  get durationDays(): number | null { return this._durationDays; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get translations(): ItemTranslation[] { return this._translations; }
}

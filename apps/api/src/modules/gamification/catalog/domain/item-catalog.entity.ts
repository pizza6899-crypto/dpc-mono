import type { EffectType, ExchangeCurrencyCode, ItemType, Language } from '@prisma/client';
import { Prisma } from '@prisma/client';

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
 * 
 * 시스템 내의 모든 아이템(장비, 소모품, 버프, 바우처)의 마스터 데이터를 관리합니다.
 * 아이템의 효과(Effects), 가격, 유효 기간 등을 포함합니다.
 */
export class ItemCatalog {
  private constructor(
    private readonly _id: bigint,
    private readonly _code: string,
    private readonly _type: ItemType,
    private readonly _effects: ItemEffect[],
    private readonly _price: Prisma.Decimal,
    private readonly _priceCurrency: ExchangeCurrencyCode,
    private readonly _durationDays: number | null,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _translations: ItemTranslation[],
  ) {}

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    id: bigint;
    code: string;
    type: ItemType;
    effects: any; // Prisma Json
    price: Prisma.Decimal;
    priceCurrency: ExchangeCurrencyCode;
    durationDays: number | null;
    createdAt: Date;
    updatedAt: Date;
    translations: ItemTranslation[];
  }): ItemCatalog {
    return new ItemCatalog(
      data.id,
      data.code,
      data.type,
      data.effects as ItemEffect[],
      data.price,
      data.priceCurrency,
      data.durationDays,
      data.createdAt,
      data.updatedAt,
      data.translations,
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
    return new ItemCatalog(
      0n,
      params.code,
      params.type,
      params.effects,
      params.price,
      params.priceCurrency ?? 'USD',
      params.durationDays ?? null,
      new Date(),
      new Date(),
      params.translations,
    );
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

  get id(): bigint {
    return this._id;
  }

  get code(): string {
    return this._code;
  }

  get type(): ItemType {
    return this._type;
  }

  get effects(): ItemEffect[] {
    return this._effects;
  }

  get price(): Prisma.Decimal {
    return this._price;
  }

  get priceCurrency(): ExchangeCurrencyCode {
    return this._priceCurrency;
  }

  get durationDays(): number | null {
    return this._durationDays;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get translations(): ItemTranslation[] {
    return this._translations;
  }
}

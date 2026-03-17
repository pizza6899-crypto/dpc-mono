// src/modules/promotion/domain/model/promotion.entity.ts
import type {
  PromotionTargetType,
  Language,
} from '@prisma/client';
import type { PromotionCurrencyRule } from './promotion-currency-rule.entity';

export interface PromotionTranslation {
  id: bigint;
  promotionId: bigint;
  language: Language;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Promotion {
  private constructor(
    public readonly id: bigint,
    private _isActive: boolean,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly targetType: PromotionTargetType,
    public readonly maxUsageCount: number | null,
    public readonly currentUsageCount: number,
    public readonly bonusExpiryMinutes: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy: bigint | null,
    public readonly updatedBy: bigint | null,
    private _deletedAt: Date | null = null,
    private _currencyRules?: PromotionCurrencyRule[],
    private _translations?: PromotionTranslation[],
  ) { }

  static fromPersistence(data: {
    id: bigint;
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
    targetType: PromotionTargetType;
    maxUsageCount: number | null;
    currentUsageCount: number;
    bonusExpiryMinutes: number | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: bigint | null;
    updatedBy: bigint | null;
    deletedAt?: Date | null;
    currencyRules?: PromotionCurrencyRule[];
    translations?: PromotionTranslation[];
  }): Promotion {
    return new Promotion(
      data.id,
      data.isActive,
      data.startDate,
      data.endDate,
      data.targetType,
      data.maxUsageCount,
      data.currentUsageCount,
      data.bonusExpiryMinutes,
      data.createdAt,
      data.updatedAt,
      data.createdBy,
      data.updatedBy,
      data.deletedAt ?? null,
      data.currencyRules,
      data.translations,
    );
  }

  get isActive(): boolean {
    return this._isActive;
  }

  toggleActive(): void {
    this._isActive = !this._isActive;
  }

  isCurrentlyActive(now: Date = new Date()): boolean {
    if (!this._isActive || this.isDeleted()) {
      return false;
    }

    if (this.startDate && now < this.startDate) {
      return false;
    }

    if (this.endDate && now > this.endDate) {
      return false;
    }

    return true;
  }

  getCurrencyRule(currency: string): PromotionCurrencyRule | undefined {
    return this._currencyRules?.find((c) => c.currency === currency);
  }

  getCurrencyRules(): PromotionCurrencyRule[] | undefined {
    return this._currencyRules;
  }

  setCurrencyRules(rules: PromotionCurrencyRule[]): void {
    (this as any)._currencyRules = rules;
  }

  getTranslation(language: Language): PromotionTranslation | undefined {
    return this._translations?.find((t) => t.language === language);
  }

  getTranslations(): PromotionTranslation[] | undefined {
    return this._translations;
  }

  setTranslations(translations: PromotionTranslation[]): void {
    (this as any)._translations = translations;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  markAsDeleted(): void {
    this._deletedAt = new Date();
  }

  toPersistence() {
    return {
      id: this.id,
      isActive: this._isActive,
      startDate: this.startDate,
      endDate: this.endDate,
      targetType: this.targetType,
      maxUsageCount: this.maxUsageCount,
      currentUsageCount: this.currentUsageCount,
      bonusExpiryMinutes: this.bonusExpiryMinutes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      deletedAt: this._deletedAt,
    };
  }
}

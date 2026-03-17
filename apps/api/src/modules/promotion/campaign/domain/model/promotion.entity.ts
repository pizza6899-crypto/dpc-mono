// src/modules/promotion/campaign/domain/model/promotion.entity.ts
import type {
  PromotionTargetType,
  PromotionResetType,
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
    public readonly maxUsagePerUser: number | null,
    public readonly periodicResetType: PromotionResetType,
    public readonly applicableDays: number[],
    public readonly applicableStartTime: Date | null,
    public readonly applicableEndTime: Date | null,
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
    maxUsagePerUser: number | null;
    periodicResetType: PromotionResetType;
    applicableDays: number[];
    applicableStartTime: Date | null;
    applicableEndTime: Date | null;
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
      data.maxUsagePerUser,
      data.periodicResetType,
      data.applicableDays,
      data.applicableStartTime,
      data.applicableEndTime,
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

    // 1. 기간 체크
    if (this.startDate && now < this.startDate) {
      return false;
    }
    if (this.endDate && now > this.endDate) {
      return false;
    }

    // 2. 요일 체크 (applicableDays가 있으면 현재 요일이 포함되어야 함)
    if (this.applicableDays && this.applicableDays.length > 0) {
      const currentDay = now.getUTCDay(); // 0: Sunday, 1: Monday, ...
      if (!this.applicableDays.includes(currentDay)) {
        return false;
      }
    }

    // 3. 시간대 체크 (시간/분만 비교)
    if (this.applicableStartTime || this.applicableEndTime) {
      const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();

      if (this.applicableStartTime) {
        const startMinutes =
          this.applicableStartTime.getUTCHours() * 60 +
          this.applicableStartTime.getUTCMinutes();
        if (currentMinutes < startMinutes) {
          return false;
        }
      }

      if (this.applicableEndTime) {
        const endMinutes =
          this.applicableEndTime.getUTCHours() * 60 +
          this.applicableEndTime.getUTCMinutes();
        if (currentMinutes > endMinutes) {
          return false;
        }
      }
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

  /**
   * 현재 리셋 주기의 시작일 계산
   */
  getCurrentPeriodStartDate(now: Date = new Date()): Date {
    const startDate = new Date(now);
    startDate.setMilliseconds(0);
    startDate.setSeconds(0);
    startDate.setMinutes(0);
    startDate.setHours(0);

    switch (this.periodicResetType) {
      case 'DAILY':
        return startDate;
      case 'WEEKLY': {
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // 월요일 기준
        startDate.setDate(diff);
        return startDate;
      }
      case 'MONTHLY':
        startDate.setDate(1);
        return startDate;
      default:
        return new Date(0); // NONE 또는 기타: 전체 기간 (Epoch)
    }
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
      maxUsagePerUser: this.maxUsagePerUser,
      periodicResetType: this.periodicResetType,
      applicableDays: this.applicableDays,
      applicableStartTime: this.applicableStartTime,
      applicableEndTime: this.applicableEndTime,
      bonusExpiryMinutes: this.bonusExpiryMinutes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      createdBy: this.createdBy,
      updatedBy: this.updatedBy,
      deletedAt: this._deletedAt,
    };
  }
}

// src/modules/promotion/domain/model/promotion.entity.ts
import { Prisma } from '@prisma/client';
import {
  PromotionTargetType,
  PromotionBonusType,
  PromotionQualification,
  Language,
} from '@prisma/client';
import { PromotionCurrency } from './promotion-currency.entity';

export interface PromotionTranslation {
  id: bigint;
  promotionId: bigint;
  language: Language;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Promotion {
  private constructor(
    public readonly id: bigint,
    public readonly code: string,
    public readonly managementName: string,
    private _isActive: boolean,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly targetType: PromotionTargetType,
    public readonly bonusType: PromotionBonusType,
    public readonly bonusRate: Prisma.Decimal | null,
    public readonly rollingMultiplier: Prisma.Decimal | null,
    public readonly qualificationMaintainCondition: PromotionQualification,
    public readonly isOneTime: boolean = false,
    public readonly isDepositRequired: boolean = true,
    public readonly maxUsageCount: number | null,
    public readonly currentUsageCount: number,
    public readonly bonusExpiryMinutes: number | null,
    public readonly note: string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    private _deletedAt: Date | null = null, // 소프트 삭제
    private _currencies?: PromotionCurrency[], // 통화별 설정 (optional, 필요시 로드)
    private _translations?: PromotionTranslation[], // 번역 정보 (optional, 필요시 로드)
  ) { }

  static fromPersistence(data: {
    id: bigint;
    code: string;
    managementName: string;
    isActive: boolean;
    startDate: Date | null;
    endDate: Date | null;
    targetType: PromotionTargetType;
    bonusType: PromotionBonusType;
    bonusRate: Prisma.Decimal | null;
    rollingMultiplier: Prisma.Decimal | null;
    qualificationMaintainCondition: PromotionQualification;
    isOneTime?: boolean;
    isDepositRequired?: boolean;
    maxUsageCount?: number | null;
    currentUsageCount?: number;
    bonusExpiryMinutes?: number | null;
    note?: string[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null; // 스키마에 없을 수 있으므로 optional
    currencies?: PromotionCurrency[]; // 통화별 설정 (optional)
    translations?: PromotionTranslation[]; // 번역 정보 (optional)
  }): Promotion {
    return new Promotion(
      data.id,
      data.code,
      data.managementName,
      data.isActive,
      data.startDate,
      data.endDate,
      data.targetType,
      data.bonusType,
      data.bonusRate,
      data.rollingMultiplier,
      data.qualificationMaintainCondition,
      data.isOneTime ?? false,
      data.isDepositRequired ?? true,
      data.maxUsageCount ?? null,
      data.currentUsageCount ?? 0,
      data.bonusExpiryMinutes ?? null,
      data.note ?? [],
      data.createdAt,
      data.updatedAt,
      data.deletedAt ?? null,
      data.currencies,
      data.translations,
    );
  }

  get isActive(): boolean {
    return this._isActive;
  }

  toggleActive(): void {
    this._isActive = !this._isActive;
  }

  setActive(active: boolean): void {
    this._isActive = active;
  }

  addNote(note: string): void {
    this.note.push(note);
  }

  isCurrentlyActive(now: Date = new Date()): boolean {
    if (!this._isActive) {
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

  calculateBonus(
    depositAmount: Prisma.Decimal,
    maxBonusAmount?: Prisma.Decimal | null,
  ): Prisma.Decimal {
    // 1. FIXED 보너스인 경우
    if (this.bonusType === PromotionBonusType.FIXED_AMOUNT) {
      return maxBonusAmount ?? new Prisma.Decimal(0);
    }

    // 2. PERCENTAGE 보너스인 경우
    if (this.bonusType !== PromotionBonusType.PERCENTAGE) {
      return new Prisma.Decimal(0);
    }

    if (!this.bonusRate) {
      return new Prisma.Decimal(0);
    }

    let bonus = depositAmount.mul(this.bonusRate);

    // 통화별 maxBonusAmount 사용 (필수)
    if (maxBonusAmount && bonus.gt(maxBonusAmount)) {
      bonus = maxBonusAmount;
    }

    return bonus;
  }

  getRollingMultiplier(): Prisma.Decimal {
    return this.rollingMultiplier ?? new Prisma.Decimal(1.0);
  }

  /**
   * 통화별 설정 조회
   * @returns 통화별 설정 배열 (없으면 undefined)
   */
  getCurrencies(): PromotionCurrency[] | undefined {
    return this._currencies;
  }

  /**
   * 특정 통화의 설정 조회
   */
  getCurrency(currency: string): PromotionCurrency | undefined {
    return this._currencies?.find((c) => c.currency === currency);
  }

  /**
   * 통화별 설정 설정 (내부용)
   */
  setCurrencies(currencies: PromotionCurrency[]): void {
    (this as any)._currencies = currencies;
  }

  /**
   * 번역 정보 조회
   * @returns 번역 정보 배열 (없으면 undefined)
   */
  getTranslations(): PromotionTranslation[] | undefined {
    return this._translations;
  }

  /**
   * 특정 언어의 번역 조회
   */
  getTranslation(language: Language): PromotionTranslation | undefined {
    return this._translations?.find((t) => t.language === language);
  }

  /**
   * 번역 정보 설정 (내부용)
   */
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

  restore(): void {
    this._deletedAt = null;
  }

  toPersistence() {
    return {
      id: this.id,
      code: this.code,
      managementName: this.managementName,
      isActive: this._isActive,
      startDate: this.startDate,
      endDate: this.endDate,
      targetType: this.targetType,
      bonusType: this.bonusType,
      bonusRate: this.bonusRate,
      rollingMultiplier: this.rollingMultiplier,
      qualificationMaintainCondition: this.qualificationMaintainCondition,
      isOneTime: this.isOneTime,
      isDepositRequired: this.isDepositRequired,
      maxUsageCount: this.maxUsageCount,
      currentUsageCount: this.currentUsageCount,
      bonusExpiryMinutes: this.bonusExpiryMinutes,
      note: this.note,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this._deletedAt,
    };
  }
}


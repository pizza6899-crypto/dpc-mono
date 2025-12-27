// src/modules/affiliate/commission/domain/model/affiliate-tier.entity.ts
import type { AffiliateTierLevel } from '@prisma/client';
import { Prisma } from '@prisma/client';
import {
  InvalidCommissionRateException,
  InvalidWalletBalanceException,
} from '../commission.exception';

/**
 * 어필리에이트 티어 엔티티
 * 티어별 요율 및 수동 조절 관리
 */
export class AffiliateTier {
  private constructor(
    public readonly id: bigint | null, // 내부 관리용 (DB 저장 시 자동 생성)
    public readonly uid: string, // 비즈니스용 (CUID, 애플리케이션에서 생성 필수)
    public readonly affiliateId: string,
    private _tier: AffiliateTierLevel,
    private _baseRate: Prisma.Decimal, // 티어별 기본 요율 (예: 0.01 = 1%)
    private _customRate: Prisma.Decimal | null, // 관리자가 수동 설정한 요율
    private _isCustomRate: boolean,
    private _monthlyWagerAmount: Prisma.Decimal, // 월간 총 베팅 금액
    private _customRateSetBy: string | null,
    private _customRateSetAt: Date | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  /**
   * 새로운 티어 생성
   * @param params - 티어 생성 파라미터
   * @returns 생성된 티어 엔티티
   * @description 새 엔티티 생성 시 id=null, uid는 애플리케이션에서 CUID 생성하여 전달 필수
   * @description Application 레이어에서 Prisma.Decimal로 변환하여 전달해야 함
   */
  static create(params: {
    id?: bigint; // 선택적: 영속화된 엔티티 재생성 시에만 사용
    uid: string; // 필수: 애플리케이션에서 CUID 생성하여 전달 (IdUtil.generateUid() 사용)
    affiliateId: string;
    tier: AffiliateTierLevel;
    baseRate: Prisma.Decimal;
    customRate?: Prisma.Decimal | null; // 기본값: null
    isCustomRate?: boolean; // 기본값: false
    monthlyWagerAmount?: Prisma.Decimal; // 기본값: 0
    customRateSetBy?: string | null; // 기본값: null
    customRateSetAt?: Date | null; // 기본값: null
  }): AffiliateTier {
    const baseRate = params.baseRate;
    const customRate = params.customRate ?? null;
    const isCustomRate = params.isCustomRate ?? false;
    const monthlyWagerAmount =
      params.monthlyWagerAmount ?? new Prisma.Decimal(0);

    // 요율 검증: baseRate는 0보다 크고 1(100%) 이하여야 함
    // Prisma.Decimal을 bigint로 변환 (10000 기준: 0.01 = 100)
    const baseRateAsBigInt = BigInt(baseRate.mul(10000).toFixed(0));
    if (baseRate.lte(0) || baseRate.gt(1)) {
      throw new InvalidCommissionRateException(baseRateAsBigInt);
    }

    // customRate 검증 (설정된 경우)
    if (customRate !== null) {
      const customRateAsBigInt = BigInt(customRate.mul(10000).toFixed(0));
      if (customRate.lte(0) || customRate.gt(1)) {
        throw new InvalidCommissionRateException(customRateAsBigInt);
      }
    }

    // isCustomRate와 customRate 일관성 검증
    if (isCustomRate && customRate === null) {
      throw new InvalidWalletBalanceException(
        'customRate is required when custom rate is enabled (isCustomRate is true).',
      );
    }
    if (!isCustomRate && customRate !== null) {
      throw new InvalidWalletBalanceException(
        'If the custom rate is disabled (isCustomRate is false), customRate must be null.',
      );
    }

    // monthlyWagerAmount 음수 검증
    if (monthlyWagerAmount.lt(0)) {
      throw new InvalidWalletBalanceException(
        `Monthly wager amount cannot be negative: ${monthlyWagerAmount}`,
      );
    }

    const now = new Date();
    return new AffiliateTier(
      params.id ?? null,
      params.uid,
      params.affiliateId,
      params.tier,
      baseRate,
      customRate,
      isCustomRate,
      monthlyWagerAmount,
      params.customRateSetBy ?? null,
      params.customRateSetAt ?? null,
      now,
      now,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * @description 영속화된 엔티티는 id와 uid 모두 보유
   * @description Mapper에서 Prisma.Decimal로 변환하여 전달해야 함
   */
  static fromPersistence(data: {
    id: bigint | null;
    uid: string;
    affiliateId: string;
    tier: AffiliateTierLevel;
    baseRate: Prisma.Decimal;
    customRate: Prisma.Decimal | null;
    isCustomRate: boolean;
    monthlyWagerAmount: Prisma.Decimal;
    customRateSetBy: string | null;
    customRateSetAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): AffiliateTier {
    return new AffiliateTier(
      data.id,
      data.uid,
      data.affiliateId,
      data.tier,
      data.baseRate,
      data.customRate,
      data.isCustomRate,
      data.monthlyWagerAmount,
      data.customRateSetBy,
      data.customRateSetAt,
      data.createdAt,
      data.updatedAt,
    );
  }

  // Getters
  get tier(): AffiliateTierLevel {
    return this._tier;
  }

  get baseRate(): Prisma.Decimal {
    return this._baseRate;
  }

  get customRate(): Prisma.Decimal | null {
    return this._customRate;
  }

  get isCustomRate(): boolean {
    return this._isCustomRate;
  }

  get monthlyWagerAmount(): Prisma.Decimal {
    return this._monthlyWagerAmount;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get customRateSetBy(): string | null {
    return this._customRateSetBy;
  }

  get customRateSetAt(): Date | null {
    return this._customRateSetAt;
  }

  // Business Logic Methods

  /**
   * 현재 적용 요율 조회
   * 수동 조절된 요율이 있으면 우선 사용, 없으면 기본 요율 사용
   * @returns 적용 요율 (예: 0.01 = 1%)
   */
  getEffectiveRate(): Prisma.Decimal {
    return this._isCustomRate && this._customRate
      ? this._customRate
      : this._baseRate;
  }

  /**
   * 수동 요율 설정 가능 여부 확인
   * @param rate - 설정할 요율 (예: 0.01 = 1%)
   * @returns 설정 가능 여부
   */
  canSetCustomRate(rate: Prisma.Decimal): boolean {
    // 요율은 0보다 크고 1(100%) 이하여야 함
    return rate.gt(0) && rate.lte(1);
  }

  /**
   * 티어 및 기본 요율 업데이트
   * @param tier - 새로운 티어 레벨
   * @param baseRate - 새로운 기본 요율 (예: 0.01 = 1%)
   * @throws {InvalidCommissionRateException} 요율이 유효하지 않은 경우
   */
  updateTier(tier: AffiliateTierLevel, baseRate: Prisma.Decimal): void {
    // 요율 검증
    const baseRateAsBigInt = BigInt(baseRate.mul(10000).toFixed(0));
    if (baseRate.lte(0) || baseRate.gt(1)) {
      throw new InvalidCommissionRateException(baseRateAsBigInt);
    }

    this._tier = tier;
    this._baseRate = baseRate;
    this._updatedAt = new Date();
  }

  /**
   * 수동 요율 설정
   * @param customRate - 설정할 요율 (예: 0.01 = 1%)
   * @param setBy - 설정한 관리자 ID
   * @throws {InvalidCommissionRateException} 요율이 유효하지 않은 경우
   */
  setCustomRate(customRate: Prisma.Decimal, setBy: string): void {
    // 요율 검증
    const customRateAsBigInt = BigInt(customRate.mul(10000).toFixed(0));
    if (customRate.lte(0) || customRate.gt(1)) {
      throw new InvalidCommissionRateException(customRateAsBigInt);
    }

    this._customRate = customRate;
    this._isCustomRate = true;
    this._customRateSetBy = setBy;
    this._customRateSetAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 수동 요율 해제 (기본 요율로 복귀)
   */
  resetCustomRate(): void {
    this._customRate = null;
    this._isCustomRate = false;
    this._customRateSetBy = null;
    this._customRateSetAt = null;
    this._updatedAt = new Date();
  }

  /**
   * 월간 베팅 금액 업데이트
   * @param amount - 추가할 베팅 금액
   * @throws {InvalidWalletBalanceException} 금액이 음수인 경우
   */
  updateMonthlyWagerAmount(amount: Prisma.Decimal): void {
    if (amount.lt(0)) {
      throw new InvalidWalletBalanceException(
        `Monthly wager amount cannot be negative: ${amount}`,
      );
    }
    this._monthlyWagerAmount = this._monthlyWagerAmount.add(amount);
    this._updatedAt = new Date();
  }

  /**
   * 월간 베팅 금액 초기화 (월간 리셋)
   */
  resetMonthlyWagerAmount(): void {
    this._monthlyWagerAmount = new Prisma.Decimal(0);
    this._updatedAt = new Date();
  }

  /**
   * DB 저장을 위한 데이터 변환
   */
  toPersistence() {
    return {
      id: this.id,
      uid: this.uid,
      affiliateId: this.affiliateId,
      tier: this._tier,
      baseRate: this._baseRate,
      customRate: this._customRate,
      isCustomRate: this._isCustomRate,
      monthlyWagerAmount: this._monthlyWagerAmount,
      customRateSetBy: this._customRateSetBy,
      customRateSetAt: this._customRateSetAt,
      createdAt: this.createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

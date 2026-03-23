import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { InvalidGamificationConfigParameterException } from './catalog.exception';

/**
 * [Gamification] 시스템 전역 정책 설정 도메인 엔티티
 * 
 * 게이미피케이션 엔진의 밸런스와 비용 정책을 관리하는 싱글톤 엔티티입니다.
 * 획득 경험치(XP) 배율, 레벨업 시 지급되는 스탯 포인트, 스탯 상한선 및 초기화 정책을 포함합니다.
 */
export class GamificationConfig {
  /**
   * 게이미피케이션 설정의 유일한 식별자 (Singleton)
   */
  static readonly CONFIG_ID = 1;

  private constructor(
    private _expGrantMultiplierUsd: Prisma.Decimal,
    private _statPointGrantPerLevel: number,
    private _maxStatLimit: number,
    private _statResetPrice: Prisma.Decimal,
    private _statResetCurrency: ExchangeCurrencyCode,
    private _updatedAt: Date,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    expGrantMultiplierUsd: Prisma.Decimal;
    statPointGrantPerLevel: number;
    maxStatLimit: number;
    statResetPrice: Prisma.Decimal;
    statResetCurrency: ExchangeCurrencyCode;
    updatedAt: Date;
  }): GamificationConfig {
    return new GamificationConfig(
      data.expGrantMultiplierUsd,
      data.statPointGrantPerLevel,
      data.maxStatLimit,
      data.statResetPrice,
      data.statResetCurrency,
      data.updatedAt,
    );
  }

  // --- Logic Methods ---

  /**
   * 도메인 필드 업데이트
   * 
   * 입력된 파라미터로 설정값을 부분적으로 업데이트합니다.
   * 각 필드의 최소/최댓값 등 도메인 제약 조건을 검증할 수 있는 지점입니다.
   */
  update(params: {
    expGrantMultiplierUsd?: Prisma.Decimal;
    statPointGrantPerLevel?: number;
    maxStatLimit?: number;
    statResetPrice?: Prisma.Decimal;
    statResetCurrency?: ExchangeCurrencyCode;
  }): void {
    if (params.expGrantMultiplierUsd !== undefined) {
      if (params.expGrantMultiplierUsd.isNegative()) {
        throw new InvalidGamificationConfigParameterException('XP multiplier cannot be negative.');
      }
      this._expGrantMultiplierUsd = params.expGrantMultiplierUsd;
    }

    if (params.statPointGrantPerLevel !== undefined) {
      if (params.statPointGrantPerLevel < 0) {
        throw new InvalidGamificationConfigParameterException('Stat points grant per level cannot be negative.');
      }
      this._statPointGrantPerLevel = params.statPointGrantPerLevel;
    }

    if (params.maxStatLimit !== undefined) {
      if (params.maxStatLimit < 1) {
        throw new InvalidGamificationConfigParameterException('Max stat limit must be at least 1.');
      }
      this._maxStatLimit = params.maxStatLimit;
    }

    if (params.statResetPrice !== undefined) {
      if (params.statResetPrice.isNegative()) {
        throw new InvalidGamificationConfigParameterException('Stat reset price cannot be negative.');
      }
      this._statResetPrice = params.statResetPrice;
    }

    if (params.statResetCurrency !== undefined) {
      this._statResetCurrency = params.statResetCurrency;
    }

    this._updatedAt = new Date();
  }

  /**
   * 베팅 금액(USD)에 따른 획득 경험치 계산
   */
  calculateEarnedXp(betAmountUsd: Prisma.Decimal): Prisma.Decimal {
    return betAmountUsd.mul(this._expGrantMultiplierUsd);
  }

  /**
   * 스탯 초기화가 가능한지 확인
   */
  canResetStats(heldBalance: Prisma.Decimal, currency: ExchangeCurrencyCode): boolean {
    if (this._statResetCurrency !== currency) return false;
    return heldBalance.greaterThanOrEqualTo(this._statResetPrice);
  }

  // --- Getters ---

  get id(): number {
    return GamificationConfig.CONFIG_ID;
  }

  get expGrantMultiplierUsd(): Prisma.Decimal {
    return this._expGrantMultiplierUsd;
  }

  get statPointGrantPerLevel(): number {
    return this._statPointGrantPerLevel;
  }

  get maxStatLimit(): number {
    return this._maxStatLimit;
  }

  get statResetPrice(): Prisma.Decimal {
    return this._statResetPrice;
  }

  get statResetCurrency(): ExchangeCurrencyCode {
    return this._statResetCurrency;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}

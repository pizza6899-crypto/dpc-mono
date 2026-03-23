import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

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
    private readonly _expGrantMultiplierUsd: Prisma.Decimal,
    private readonly _statPointGrantPerLevel: number,
    private readonly _maxStatLimit: number,
    private readonly _statResetPrice: Prisma.Decimal,
    private readonly _statResetCurrency: ExchangeCurrencyCode,
    private readonly _updatedAt: Date,
  ) {}

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

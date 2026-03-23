import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { MessageCode } from '@repo/shared';
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
    private _xpGrantMultiplierUsd: Prisma.Decimal,
    private _statPointsGrantPerLevel: number,
    private _maxStatLimit: number,
    private _statResetPrice: Prisma.Decimal,
    private _statResetCurrency: ExchangeCurrencyCode,
    private _updatedAt: Date,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    xpGrantMultiplierUsd: Prisma.Decimal;
    statPointsGrantPerLevel: number;
    maxStatLimit: number;
    statResetPrice: Prisma.Decimal;
    statResetCurrency: ExchangeCurrencyCode;
    updatedAt: Date;
  }): GamificationConfig {
    return new GamificationConfig(
      data.xpGrantMultiplierUsd,
      data.statPointsGrantPerLevel,
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
    xpGrantMultiplierUsd?: Prisma.Decimal;
    statPointsGrantPerLevel?: number;
    maxStatLimit?: number;
    statResetPrice?: Prisma.Decimal;
    statResetCurrency?: ExchangeCurrencyCode;
  }): void {
    if (params.xpGrantMultiplierUsd !== undefined) {
      if (params.xpGrantMultiplierUsd.isNegative()) {
        throw new InvalidGamificationConfigParameterException(MessageCode.GAMIFICATION_CONFIG_XP_MULTIPLIER_NEGATIVE, 'XP multiplier cannot be negative.');
      }
      this._xpGrantMultiplierUsd = params.xpGrantMultiplierUsd;
    }

    if (params.statPointsGrantPerLevel !== undefined) {
      if (params.statPointsGrantPerLevel < 0) {
        throw new InvalidGamificationConfigParameterException(MessageCode.GAMIFICATION_CONFIG_STAT_POINTS_NEGATIVE, 'Stat points grant per level cannot be negative.');
      }
      this._statPointsGrantPerLevel = params.statPointsGrantPerLevel;
    }

    if (params.maxStatLimit !== undefined) {
      if (params.maxStatLimit < 1) {
        throw new InvalidGamificationConfigParameterException(MessageCode.GAMIFICATION_CONFIG_STAT_LIMIT_NEGATIVE, 'Max stat limit must be at least 1.');
      }
      this._maxStatLimit = params.maxStatLimit;
    }

    if (params.statResetPrice !== undefined) {
      if (params.statResetPrice.isNegative()) {
        throw new InvalidGamificationConfigParameterException(MessageCode.GAMIFICATION_CONFIG_PRICE_NEGATIVE, 'Stat reset price cannot be negative.');
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
    return betAmountUsd.mul(this._xpGrantMultiplierUsd);
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

  get xpGrantMultiplierUsd(): Prisma.Decimal {
    return this._xpGrantMultiplierUsd;
  }

  get statPointsGrantPerLevel(): number {
    return this._statPointsGrantPerLevel;
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

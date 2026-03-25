import { Prisma, ExchangeCurrencyCode } from '@prisma/client';
import { 
  InvalidMaxStatLimitException, 
  InvalidResetPriceException, 
  InvalidStatPointsPerLevelException, 
  InvalidXPMultiplierException 
} from './master.exception';

/**
 * 통화별 스탯 초기화 고정 가격표 타입
 */
export type StatResetPriceTable = Partial<Record<ExchangeCurrencyCode, number>>;

/**
 * [Character] 시스템 전역 정책 설정 도메인 엔티티
 * 
 * 게이미피케이션 엔진의 밸런스와 비용 정책을 관리하는 싱글톤 엔티티입니다.
 * 획득 경험치(XP) 배율, 레벨업 시 지급되는 스탯 포인트, 스탯 상한선 및 초기화 정책을 포함합니다.
 */
export class CharacterConfig {
  /**
   * 게이미피케이션 설정의 유일한 식별자 (Singleton)
   */
  static readonly CONFIG_ID = 1;

  private constructor(
    private _xpGrantMultiplierUsd: Prisma.Decimal,
    private _statPointsGrantPerLevel: number,
    private _maxStatLimit: number,
    private _statResetPrices: StatResetPriceTable,
    private _updatedAt: Date,
  ) { }

  /**
   * 영속성 계층에서 복원
   */
  static rehydrate(data: {
    xpGrantMultiplierUsd: Prisma.Decimal;
    statPointsGrantPerLevel: number;
    maxStatLimit: number;
    statResetPrices: any; // Prisma Json
    updatedAt: Date;
  }): CharacterConfig {
    return new CharacterConfig(
      data.xpGrantMultiplierUsd,
      data.statPointsGrantPerLevel,
      data.maxStatLimit,
      (data.statResetPrices || {}) as StatResetPriceTable,
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
    statResetPrices?: StatResetPriceTable;
  }): void {
    if (params.xpGrantMultiplierUsd !== undefined) {
      if (params.xpGrantMultiplierUsd.isNegative()) {
        throw new InvalidXPMultiplierException();
      }
      this._xpGrantMultiplierUsd = params.xpGrantMultiplierUsd;
    }

    if (params.statPointsGrantPerLevel !== undefined) {
      if (params.statPointsGrantPerLevel < 0) {
        throw new InvalidStatPointsPerLevelException();
      }
      this._statPointsGrantPerLevel = params.statPointsGrantPerLevel;
    }

    if (params.maxStatLimit !== undefined) {
      if (params.maxStatLimit < 1) {
        throw new InvalidMaxStatLimitException();
      }
      this._maxStatLimit = params.maxStatLimit;
    }

    if (params.statResetPrices !== undefined) {
      // 값 검증: 모든 가격은 0 이상이어야 함
      for (const [currency, price] of Object.entries(params.statResetPrices)) {
        if (price !== undefined && price < 0) {
          throw new InvalidResetPriceException(`Price for ${currency} cannot be negative.`);
        }
      }
      this._statResetPrices = params.statResetPrices;
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
   * 특정 통화에 대한 스탯 초기화 가격 조회
   */
  getResetPrice(currency: ExchangeCurrencyCode): Prisma.Decimal | null {
    const price = this._statResetPrices[currency];
    if (price === undefined) return null;
    return new Prisma.Decimal(price);
  }

  /**
   * 스탯 초기화가 가능한지 확인
   */
  canResetStats(heldBalance: Prisma.Decimal, currency: ExchangeCurrencyCode): boolean {
    const price = this.getResetPrice(currency);
    if (!price) return false;
    return heldBalance.greaterThanOrEqualTo(price);
  }

  // --- Getters ---

  get id(): number {
    return CharacterConfig.CONFIG_ID;
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

  get statResetPrices(): StatResetPriceTable {
    return { ...this._statResetPrices };
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}

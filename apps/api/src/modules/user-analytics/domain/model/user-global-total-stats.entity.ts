import { Prisma } from '@prisma/client';

/**
 * UserGlobalTotalStats 도메인 엔티티
 *
 * 유저의 모든 활동을 USD로 환산하여 평생 누적치(LTV, GGR 등)를 관리합니다.
 * 이 엔티티는 오직 원자적 수치 증감과 랭킹 산정을 위한 상태만을 가집니다.
 */
export class UserGlobalTotalStats {
  private constructor(
    public readonly userId: bigint,

    // KPI (Business Indicators)
    private _ltvUsd: Prisma.Decimal,
    private _ggrUsd: Prisma.Decimal,
    private _ngrUsd: Prisma.Decimal,

    // Aggregates (Raw Accumulations)
    private _totalDepositUsd: Prisma.Decimal,
    private _totalWithdrawUsd: Prisma.Decimal,
    private _totalBetUsd: Prisma.Decimal,
    private _totalWinUsd: Prisma.Decimal,
    private _totalPromoUsd: Prisma.Decimal,

    public readonly updatedAt: Date,
  ) {}

  /**
   * 신규 유저 통계 초기화
   */
  static create(userId: bigint): UserGlobalTotalStats {
    return new UserGlobalTotalStats(
      userId,
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Prisma.Decimal(0),
      new Date(),
    );
  }

  /**
   * DB 영속성 레이어로부터 엔티티 복원
   */
  static fromPersistence(data: {
    userId: bigint;
    ltvUsd: Prisma.Decimal;
    ggrUsd: Prisma.Decimal;
    ngrUsd: Prisma.Decimal;
    totalDepositUsd: Prisma.Decimal;
    totalWithdrawUsd: Prisma.Decimal;
    totalBetUsd: Prisma.Decimal;
    totalWinUsd: Prisma.Decimal;
    totalPromoUsd: Prisma.Decimal;
    updatedAt: Date;
  }): UserGlobalTotalStats {
    return new UserGlobalTotalStats(
      data.userId,
      data.ltvUsd,
      data.ggrUsd,
      data.ngrUsd,
      data.totalDepositUsd,
      data.totalWithdrawUsd,
      data.totalBetUsd,
      data.totalWinUsd,
      data.totalPromoUsd,
      data.updatedAt,
    );
  }

  // Getters
  get ltvUsd(): Prisma.Decimal {
    return this._ltvUsd;
  }
  get ggrUsd(): Prisma.Decimal {
    return this._ggrUsd;
  }
  get ngrUsd(): Prisma.Decimal {
    return this._ngrUsd;
  }
  get totalDepositUsd(): Prisma.Decimal {
    return this._totalDepositUsd;
  }
  get totalWithdrawUsd(): Prisma.Decimal {
    return this._totalWithdrawUsd;
  }
  get totalBetUsd(): Prisma.Decimal {
    return this._totalBetUsd;
  }
  get totalWinUsd(): Prisma.Decimal {
    return this._totalWinUsd;
  }
  get totalPromoUsd(): Prisma.Decimal {
    return this._totalPromoUsd;
  }
}

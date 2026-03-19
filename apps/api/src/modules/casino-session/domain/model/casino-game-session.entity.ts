import type { GameAggregatorType, ExchangeCurrencyCode } from '@prisma/client';
import { Prisma } from '@prisma/client';

export class CasinoGameSession {
  private constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public readonly playerName: string,
    public readonly token: string,
    public readonly aggregatorType: GameAggregatorType,
    public readonly walletCurrency: ExchangeCurrencyCode,
    public readonly gameCurrency: ExchangeCurrencyCode,
    public readonly exchangeRate: Prisma.Decimal,
    public readonly exchangeRateSnapshotAt: Date,
    public readonly usdExchangeRate: Prisma.Decimal,
    public readonly compRate: Prisma.Decimal,
    public readonly gameId: bigint | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastAccessedAt: Date,
    public readonly revokedAt: Date | null = null,
    public readonly revokedBy: bigint | null = null,
  ) {}

  static create(params: {
    id?: bigint;
    userId: bigint;
    playerName: string;
    token: string;
    aggregatorType: GameAggregatorType;
    walletCurrency: ExchangeCurrencyCode;
    gameCurrency: ExchangeCurrencyCode;
    exchangeRate: Prisma.Decimal;
    exchangeRateSnapshotAt?: Date;
    usdExchangeRate?: Prisma.Decimal;
    compRate?: Prisma.Decimal;
    gameId?: bigint | null;
    createdAt?: Date;
    updatedAt?: Date;
    lastAccessedAt?: Date;
    revokedAt?: Date | null;
    revokedBy?: bigint | null;
  }): CasinoGameSession {
    return new CasinoGameSession(
      params.id ?? 0n,
      params.userId,
      params.playerName,
      params.token,
      params.aggregatorType,
      params.walletCurrency,
      params.gameCurrency,
      params.exchangeRate,
      params.exchangeRateSnapshotAt ?? new Date(),
      params.usdExchangeRate ?? new Prisma.Decimal(1),
      params.compRate ?? new Prisma.Decimal(0),
      params.gameId ?? null,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date(),
      params.lastAccessedAt ?? new Date(),
      params.revokedAt ?? null,
      params.revokedBy ?? null,
    );
  }

  /**
   * 세션 파기 처리
   * @param revokedBy 파기한 관리자 ID
   */
  revoke(revokedBy: bigint): CasinoGameSession {
    return CasinoGameSession.create({
      ...this,
      revokedAt: new Date(),
      revokedBy,
    });
  }

  /**
   * 세션이 파기되었는지 확인
   */
  get isRevoked(): boolean {
    return this.revokedAt !== null;
  }
}

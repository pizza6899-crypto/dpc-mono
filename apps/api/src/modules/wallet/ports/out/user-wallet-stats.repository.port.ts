import type { UserWalletTotalStats, UserWalletHourlyStats } from '../../domain';
import type { ExchangeCurrencyCode, Prisma } from '@prisma/client';

export type UpdateWalletStatsDto = {
  userId: bigint;
  currency: ExchangeCurrencyCode;
  depositCash?: Prisma.Decimal;
  withdrawCash?: Prisma.Decimal;
  betCash?: Prisma.Decimal;
  winCash?: Prisma.Decimal;
  bonusGiven?: Prisma.Decimal;
  bonusUsed?: Prisma.Decimal;
  betBonus?: Prisma.Decimal;
  winBonus?: Prisma.Decimal;
  compEarned?: Prisma.Decimal;
  compUsed?: Prisma.Decimal;
  vaultIn?: Prisma.Decimal;
  vaultOut?: Prisma.Decimal;
  currentBalance?: {
    cash: Prisma.Decimal;
    bonus: Prisma.Decimal;
  };
  timestamp?: Date; // 트랜잭션 발생 시간 (Hourly stats 파티셔닝 기준)
};

export interface UserWalletStatsRepositoryPort {
  // Basic CRUD (Domain-based)
  getTotalStats(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<UserWalletTotalStats | null>;
  saveTotalStats(stats: UserWalletTotalStats): Promise<void>;
  getHourlyStats(
    userId: bigint,
    currency: ExchangeCurrencyCode,
    date: Date,
  ): Promise<UserWalletHourlyStats | null>;
  saveHourlyStats(stats: UserWalletHourlyStats): Promise<void>;

  // Atomic Updates (Performance-based)
  increaseTotalStats(dto: UpdateWalletStatsDto): Promise<void>;
  updateHourlyStats(dto: UpdateWalletStatsDto): Promise<void>;
}

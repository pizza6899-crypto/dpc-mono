import type { ExchangeCurrencyCode, Prisma, CompSettlementStatus } from '@prisma/client';
import type { CompAccount } from '../domain/model/comp-account.entity';
import type { CompAccountTransaction } from '../domain/model/comp-account-transaction.entity';
import type { CompConfig } from '../domain/model/comp-config.entity';
import type { CompDailySettlement } from '../domain/model/comp-daily-settlement.entity';

export interface CompRepositoryPort {
  findByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<CompAccount | null>;
  save(account: CompAccount): Promise<CompAccount>;
  createTransaction(transaction: CompAccountTransaction): Promise<CompAccountTransaction>;

  findTransactions(params: {
    userId: bigint;
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  }): Promise<{ data: CompAccountTransaction[]; total: number }>;

  getStatsOverview(params: {
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalEarned: Prisma.Decimal;
    totalUsed: Prisma.Decimal;
  }>;

  getDailyStats(params: {
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
  }): Promise<
    Array<{
      date: string;
      earned: Prisma.Decimal;
      used: Prisma.Decimal;
    }>
  >;

  getTopEarners(params: {
    currency?: ExchangeCurrencyCode;
    limit: number;
  }): Promise<
    Array<{
      userId: bigint;
      totalEarned: Prisma.Decimal;
    }>
  >;
}

export interface CompConfigRepositoryPort {
  getConfig(currency: ExchangeCurrencyCode): Promise<CompConfig | null>;
  getAllConfigs(): Promise<CompConfig[]>;
  save(config: CompConfig): Promise<CompConfig>;
}

export interface CompDailySettlementRepositoryPort {
  save(settlement: CompDailySettlement): Promise<CompDailySettlement>;
  findByUserIdAndCurrencyAndDate(
    userId: bigint,
    currency: ExchangeCurrencyCode,
    date: Date,
  ): Promise<CompDailySettlement | null>;
  // 배치 처리용 (미정산 항목 조회)
  findPendingSettlements(untilDate: Date): Promise<
    Array<{
      userId: bigint;
      currency: ExchangeCurrencyCode;
    }>
  >;
  updateStatuses(userId: bigint, currency: ExchangeCurrencyCode, status: CompSettlementStatus, untilDate: Date, rewardId?: bigint): Promise<void>;
  getPendingTotalForUser(userId: bigint, currency: ExchangeCurrencyCode, untilDate: Date): Promise<Prisma.Decimal>;
  create(settlement: CompDailySettlement): Promise<CompDailySettlement>;
}

import type {
  ExchangeCurrencyCode,
  UserWalletTransactionType,
  UserWalletBalanceType,
} from '@prisma/client';

export interface UserWalletTransactionSearchOptions {
  userId?: bigint;
  currency?: ExchangeCurrencyCode;
  type?: UserWalletTransactionType;
  balanceTypes?: UserWalletBalanceType[];
  excludeBalanceTypes?: UserWalletBalanceType[];
  startDate?: Date;
  endDate?: Date;
  page: number; // 1-based
  limit: number;
}

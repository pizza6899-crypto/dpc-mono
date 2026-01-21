import type { ExchangeCurrencyCode, WalletTransactionType, WalletBalanceType } from '@prisma/client';

export interface WalletTransactionSearchOptions {
    userId?: bigint;
    currency?: ExchangeCurrencyCode;
    type?: WalletTransactionType;
    balanceTypes?: WalletBalanceType[];
    excludeBalanceTypes?: WalletBalanceType[];
    startDate?: Date;
    endDate?: Date;
    page: number; // 1-based
    limit: number;
}

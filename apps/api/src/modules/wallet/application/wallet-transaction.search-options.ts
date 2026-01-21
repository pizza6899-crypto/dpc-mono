// src/modules/wallet/domain/model/wallet-transaction.search-options.ts
import type { ExchangeCurrencyCode, WalletTransactionType } from '@prisma/client';

export interface WalletTransactionSearchOptions {
    userId: bigint;
    currency?: ExchangeCurrencyCode;
    type?: WalletTransactionType;
    startDate?: Date;
    endDate?: Date;
    page: number; // 1-based
    limit: number;
}

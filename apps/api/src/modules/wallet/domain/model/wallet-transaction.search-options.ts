// src/modules/wallet/domain/model/wallet-transaction.search-options.ts
import type { ExchangeCurrencyCode, TransactionType } from '@prisma/client';

export interface WalletTransactionSearchOptions {
    userId: bigint;
    currency?: ExchangeCurrencyCode;
    type?: TransactionType;
    startDate?: Date;
    endDate?: Date;
    page: number; // 1-based
    limit: number;
}

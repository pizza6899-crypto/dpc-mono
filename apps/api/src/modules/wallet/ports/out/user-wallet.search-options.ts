import type { ExchangeCurrencyCode, WalletStatus } from '@prisma/client';

export interface UserWalletSearchOptions {
    userId?: bigint;
    currency?: ExchangeCurrencyCode;
    status?: WalletStatus;
    page: number;
    limit: number;
}

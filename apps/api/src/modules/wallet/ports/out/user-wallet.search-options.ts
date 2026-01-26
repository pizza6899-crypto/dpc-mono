import type { ExchangeCurrencyCode, UserWalletStatus } from '@prisma/client';

export interface UserWalletSearchOptions {
    userId?: bigint;
    currency?: ExchangeCurrencyCode;
    status?: UserWalletStatus;
    page: number;
    limit: number;
}

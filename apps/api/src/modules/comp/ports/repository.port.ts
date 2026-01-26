import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { CompWallet } from '../domain/model/comp-wallet.entity';
import { CompTransaction } from '../domain/model/comp-transaction.entity';
import { CompConfig } from '../domain/model/comp-config.entity';
import { CompClaimHistory } from '../domain/model/comp-claim-history.entity';

export interface CompRepositoryPort {
    findByUserIdAndCurrency(userId: bigint, currency: ExchangeCurrencyCode): Promise<CompWallet | null>;
    save(wallet: CompWallet): Promise<CompWallet>;
    createTransaction(transaction: CompTransaction): Promise<CompTransaction>;
    // Deprecated?
    createMainTransaction(data: any): Promise<bigint>;

    findTransactions(params: {
        userId: bigint;
        currency?: ExchangeCurrencyCode;
        startDate?: Date;
        endDate?: Date;
        page: number;
        limit: number;
    }): Promise<{ data: CompTransaction[]; total: number }>;

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
    }): Promise<Array<{
        date: string;
        earned: Prisma.Decimal;
        used: Prisma.Decimal;
    }>>;

    getTopEarners(params: {
        currency?: ExchangeCurrencyCode;
        limit: number;
    }): Promise<Array<{
        userId: bigint;
        totalEarned: Prisma.Decimal;
    }>>;
}

export interface CompConfigRepositoryPort {
    getConfig(currency: ExchangeCurrencyCode): Promise<CompConfig | null>;
    getAllConfigs(): Promise<CompConfig[]>;
    save(config: CompConfig): Promise<CompConfig>;
}

export interface CompClaimHistoryRepositoryPort {
    save(history: CompClaimHistory): Promise<CompClaimHistory>;
    findById(id: bigint): Promise<CompClaimHistory | null>;
    findByWalletTransactionId(walletTransactionId: bigint): Promise<CompClaimHistory | null>;
}

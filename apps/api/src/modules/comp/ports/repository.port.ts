import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { CompWallet } from '../domain/model/comp-wallet.entity';
import { CompTransaction } from '../domain/model/comp-transaction.entity';

export interface CompRepositoryPort {
    findByUserIdAndCurrency(userId: bigint, currency: ExchangeCurrencyCode): Promise<CompWallet | null>;
    save(wallet: CompWallet): Promise<CompWallet>;
    createTransaction(transaction: CompTransaction): Promise<CompTransaction>;
    createMainTransaction(data: {
        userId: bigint;
        type: any; // TransactionType 삭제됨
        status: any; // TransactionStatus 삭제됨
        currency: ExchangeCurrencyCode;
        amount: Prisma.Decimal;
        beforeAmount: Prisma.Decimal;
        afterAmount: Prisma.Decimal;
        balanceDetails: {
            mainBalanceChange: Prisma.Decimal;
            mainBeforeAmount: Prisma.Decimal;
            mainAfterAmount: Prisma.Decimal;
            bonusBalanceChange: Prisma.Decimal;
            bonusBeforeAmount: Prisma.Decimal;
            bonusAfterAmount: Prisma.Decimal;
        };
        compWalletTransactionId?: bigint;
    }): Promise<bigint>;

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

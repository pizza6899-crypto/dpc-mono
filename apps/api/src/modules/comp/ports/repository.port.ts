import { ExchangeCurrencyCode, Prisma, TransactionStatus, TransactionType } from '@repo/database';
import { CompWallet } from '../domain/model/comp-wallet.entity';
import { CompTransaction } from '../domain/model/comp-transaction.entity';

export interface CompRepositoryPort {
    findByUserIdAndCurrency(userId: bigint, currency: ExchangeCurrencyCode): Promise<CompWallet | null>;
    save(wallet: CompWallet): Promise<CompWallet>;
    createTransaction(transaction: CompTransaction): Promise<CompTransaction>;
    createMainTransaction(data: {
        userId: bigint;
        type: TransactionType;
        status: TransactionStatus;
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
    }): Promise<bigint>;
}

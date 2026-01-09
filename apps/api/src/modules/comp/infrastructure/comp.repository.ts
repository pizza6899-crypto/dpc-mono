import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode, Prisma, TransactionStatus, TransactionType } from '@repo/database';
import { CompRepositoryPort } from '../ports';
import { CompWallet, CompTransaction } from '../domain';
import { CompMapper } from './comp.mapper';

@Injectable()
export class CompRepository implements CompRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CompMapper,
    ) { }

    async findByUserIdAndCurrency(userId: bigint, currency: ExchangeCurrencyCode): Promise<CompWallet | null> {
        const result = await this.tx.userCompWallet.findUnique({
            where: {
                userId_currency: {
                    userId,
                    currency,
                },
            },
        });
        return result ? this.mapper.toDomain(result) : null;
    }

    async save(wallet: CompWallet): Promise<CompWallet> {
        const data = this.mapper.toPersistence(wallet);

        // Upsert to handle both create and update
        const result = await this.tx.userCompWallet.upsert({
            where: {
                userId_currency: {
                    userId: wallet.userId,
                    currency: wallet.currency,
                },
            },
            create: {
                userId: wallet.userId,
                currency: wallet.currency,
                balance: wallet.balance,
                totalEarned: wallet.totalEarned,
                totalUsed: wallet.totalUsed,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt
            },
            update: {
                balance: wallet.balance,
                totalEarned: wallet.totalEarned,
                totalUsed: wallet.totalUsed,
                updatedAt: wallet.updatedAt,
            },
        });

        return this.mapper.toDomain(result);
    }

    async createTransaction(transaction: CompTransaction): Promise<CompTransaction> {
        const data = this.mapper.toTransactionPersistence(transaction);
        // Ensure data matches Prisma.CompWalletTransactionCreateInput
        // We need to cast or ensure structure is strictly compatible
        const result = await this.tx.compWalletTransaction.create({
            data: data as any,
        });
        return this.mapper.toTransactionDomain(result);
    }

    async createMainTransaction(data: {
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
    }): Promise<bigint> {
        const result = await this.tx.transaction.create({
            data: {
                userId: data.userId,
                type: data.type,
                status: data.status,
                currency: data.currency,
                amount: data.amount,
                beforeAmount: data.beforeAmount,
                afterAmount: data.afterAmount,
                balanceDetails: {
                    create: data.balanceDetails,
                },
            },
        });
        return result.id;
    }
}

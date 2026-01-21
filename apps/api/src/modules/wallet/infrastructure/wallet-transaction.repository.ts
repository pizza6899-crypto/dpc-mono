// src/modules/wallet/infrastructure/wallet-transaction.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { WalletTransaction } from '../domain';
import { WalletTransactionSearchOptions } from '../application/wallet-transaction.search-options';
import { Prisma } from '@prisma/client';

@Injectable()
export class WalletTransactionRepository
    implements WalletTransactionRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async create(transaction: WalletTransaction): Promise<WalletTransaction> {
        const data = {
            userId: transaction.userId,
            currency: transaction.currency,
            type: transaction.type,
            balanceType: transaction.balanceType,
            amount: transaction.amount,
            balanceAfter: transaction.balanceAfter,
            referenceId: transaction.referenceId,
            remark: transaction.remark,
            ipAddress: transaction.ipAddress,
            countryCode: transaction.countryCode,
            createdAt: transaction.createdAt,
        };

        const result = await this.tx.walletTransaction.create({
            data,
        });

        return WalletTransaction.fromPersistence(result);
    }

    async listByUserId(
        options: WalletTransactionSearchOptions,
    ): Promise<[WalletTransaction[], number]> {
        const { userId, currency, type, startDate, endDate, page, limit } = options;

        const where: Prisma.WalletTransactionWhereInput = {
            userId,
            currency,
            type,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };

        const [items, total] = await Promise.all([
            this.tx.walletTransaction.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.tx.walletTransaction.count({
                where,
            }),
        ]);

        const transactions = items.map((item) =>
            WalletTransaction.fromPersistence(item),
        );

        return [transactions, total];
    }
}

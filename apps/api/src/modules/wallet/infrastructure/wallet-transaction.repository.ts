// src/modules/wallet/infrastructure/wallet-transaction.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { WalletTransactionRepositoryPort } from '../ports/out/wallet-transaction.repository.port';
import { WalletTransaction } from '../domain';
import { WalletTransactionSearchOptions } from '../domain/model/wallet-transaction.search-options';
import { Prisma } from 'src/generated/prisma';

@Injectable()
export class WalletTransactionRepository
    implements WalletTransactionRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async create(transaction: WalletTransaction): Promise<void> {
        await this.tx.transaction.create({
            data: {
                userId: transaction.userId,
                type: transaction.type,
                status: transaction.status,
                currency: transaction.currency,
                amount: transaction.amount,
                beforeAmount: transaction.beforeAmount,
                afterAmount: transaction.afterAmount,
                createdAt: transaction.createdAt,
                balanceDetails: {
                    create: {
                        mainBalanceChange: transaction.balanceDetail.mainBalanceChange,
                        mainBeforeAmount: transaction.balanceDetail.mainBeforeAmount,
                        mainAfterAmount: transaction.balanceDetail.mainAfterAmount,
                        bonusBalanceChange: transaction.balanceDetail.bonusBalanceChange,
                        bonusBeforeAmount: transaction.balanceDetail.bonusBeforeAmount,
                        bonusAfterAmount: transaction.balanceDetail.bonusAfterAmount,
                    },
                },
                adminAdjustmentDetail: transaction.adminDetail
                    ? {
                        create: {
                            adminUserId: transaction.adminDetail.adminUserId,
                            reasonCode: transaction.adminDetail.reasonCode,
                            internalNote: transaction.adminDetail.internalNote,
                        },
                    }
                    : undefined,
                systemAdjustmentDetail: transaction.systemDetail
                    ? {
                        create: {
                            serviceName: transaction.systemDetail.serviceName,
                            triggerId: transaction.systemDetail.triggerId,
                            actionName: transaction.systemDetail.actionName,
                            metadata: transaction.systemDetail.metadata,
                        },
                    }
                    : undefined,
            },
        });
    }

    async findByUserId(
        options: WalletTransactionSearchOptions,
    ): Promise<[WalletTransaction[], number]> {
        const { userId, currency, type, startDate, endDate, page, limit } = options;

        const where: Prisma.TransactionWhereInput = {
            userId,
            currency,
            type,
            createdAt: {
                gte: startDate,
                lte: endDate,
            },
        };

        const [items, total] = await Promise.all([
            this.tx.transaction.findMany({
                where,
                include: {
                    balanceDetails: true,
                    adminAdjustmentDetail: true,
                    systemAdjustmentDetail: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.tx.transaction.count({
                where,
            }),
        ]);

        const transactions = items.map((item) => {
            const detail = item.balanceDetails[0];
            const admin = item.adminAdjustmentDetail;
            const system = item.systemAdjustmentDetail;

            return WalletTransaction.fromPersistence({
                id: item.id,
                userId: item.userId,
                type: item.type,
                status: item.status,
                currency: item.currency,
                amount: item.amount,
                beforeAmount: item.beforeAmount,
                afterAmount: item.afterAmount,
                createdAt: item.createdAt,
                balanceDetail: detail
                    ? {
                        mainBalanceChange: detail.mainBalanceChange,
                        mainBeforeAmount: detail.mainBeforeAmount,
                        mainAfterAmount: detail.mainAfterAmount,
                        bonusBalanceChange: detail.bonusBalanceChange,
                        bonusBeforeAmount: detail.bonusBeforeAmount,
                        bonusAfterAmount: detail.bonusAfterAmount,
                    }
                    : undefined,
                adminDetail: admin
                    ? {
                        adminUserId: admin.adminUserId,
                        reasonCode: admin.reasonCode,
                        internalNote: admin.internalNote,
                    }
                    : undefined,
                systemDetail: system
                    ? {
                        serviceName: system.serviceName,
                        triggerId: system.triggerId,
                        actionName: system.actionName,
                        metadata: system.metadata,
                    }
                    : undefined,
            });
        });

        return [transactions, total];
    }
}

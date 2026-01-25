import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { CompRepositoryPort } from '../ports';
import { CompWallet, CompTransaction, CompConfig, CompClaimHistory } from '../domain';
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
                isFrozen: wallet.isFrozen,
                lastClaimedAt: wallet.lastClaimedAt,
                lastActiveAt: wallet.lastActiveAt,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt
            },
            update: {
                balance: wallet.balance,
                totalEarned: wallet.totalEarned,
                totalUsed: wallet.totalUsed,
                isFrozen: wallet.isFrozen,
                lastClaimedAt: wallet.lastClaimedAt,
                lastActiveAt: wallet.lastActiveAt,
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
    }): Promise<bigint> {
        // TODO: Transaction 테이블 삭제/변경에 따른 임시 처리
        // 스키마 반영 후 WalletTransaction 등으로 대체 필요
        return BigInt(Date.now());
    }

    async findTransactions(params: {
        userId: bigint;
        currency?: ExchangeCurrencyCode;
        startDate?: Date;
        endDate?: Date;
        page: number;
        limit: number;
    }): Promise<{ data: CompTransaction[]; total: number }> {
        const { userId, currency, startDate, endDate, page, limit } = params;
        const skip = (page - 1) * limit;

        const where: Prisma.CompWalletTransactionWhereInput = {
            wallet: {
                userId: userId,
                ...(currency && { currency }),
            },
            ...((startDate || endDate) && {
                createdAt: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                },
            }),
        };

        const [data, total] = await Promise.all([
            this.tx.compWalletTransaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.tx.compWalletTransaction.count({ where }),
        ]);

        return {
            data: data.map(tx => this.mapper.toTransactionDomain(tx)),
            total,
        };
    }

    async getStatsOverview(params: {
        currency?: ExchangeCurrencyCode;
        startDate?: Date;
        endDate?: Date;
    }): Promise<{ totalEarned: Prisma.Decimal; totalUsed: Prisma.Decimal }> {
        const { currency, startDate, endDate } = params;
        const where: Prisma.CompWalletTransactionWhereInput = {
            ...(currency && { wallet: { currency } }),
            ...((startDate || endDate) && {
                createdAt: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                },
            }),
        };

        const earns = await this.tx.compWalletTransaction.aggregate({
            _sum: { amount: true },
            where: { ...where, amount: { gt: 0 } },
        });

        const claims = await this.tx.compWalletTransaction.aggregate({
            _sum: { amount: true },
            where: { ...where, amount: { lt: 0 } },
        });

        return {
            totalEarned: earns._sum.amount || new Prisma.Decimal(0),
            totalUsed: (claims._sum.amount || new Prisma.Decimal(0)).abs(),
        };
    }

    async getDailyStats(params: {
        currency?: ExchangeCurrencyCode;
        startDate?: Date;
        endDate?: Date;
    }): Promise<Array<{ date: string; earned: Prisma.Decimal; used: Prisma.Decimal }>> {
        const { currency, startDate, endDate } = params;
        const where: Prisma.CompWalletTransactionWhereInput = {
            ...(currency && { wallet: { currency } }),
            ...((startDate || endDate) && {
                createdAt: {
                    ...(startDate && { gte: startDate }),
                    ...(endDate && { lte: endDate }),
                },
            }),
        };

        const txs = await this.tx.compWalletTransaction.findMany({
            where,
            select: {
                amount: true,
                createdAt: true,
            },
        });

        const dailyMap = new Map<string, { earned: Prisma.Decimal; used: Prisma.Decimal }>();
        txs.forEach(t => {
            const dateStr = t.createdAt.toISOString().split('T')[0];
            const current = dailyMap.get(dateStr) || { earned: new Prisma.Decimal(0), used: new Prisma.Decimal(0) };
            if (t.amount.gt(0)) {
                current.earned = current.earned.add(t.amount);
            } else {
                current.used = current.used.add(t.amount.abs());
            }
            dailyMap.set(dateStr, current);
        });

        return Array.from(dailyMap.entries())
            .map(([date, stats]) => ({ date, ...stats }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async getTopEarners(params: {
        currency?: ExchangeCurrencyCode;
        limit: number;
    }): Promise<Array<{ userId: bigint; totalEarned: Prisma.Decimal }>> {
        const { currency, limit } = params;
        const where: Prisma.CompWalletTransactionWhereInput = {
            amount: { gt: 0 },
            ...(currency && { wallet: { currency } }),
        };

        const groups = await this.tx.compWalletTransaction.groupBy({
            by: ['compWalletId'],
            _sum: { amount: true },
            where,
            orderBy: {
                _sum: { amount: 'desc' },
            },
            take: limit,
        });

        const results = await Promise.all(groups.map(async g => {
            const wallet = await this.tx.userCompWallet.findUnique({
                where: { id: g.compWalletId },
                select: { userId: true },
            });
            return {
                userId: wallet?.userId || BigInt(0),
                totalEarned: g._sum.amount || new Prisma.Decimal(0),
            };
        }));

        return results;
    }

    // CompConfig Methods
    async getConfig(): Promise<CompConfig | null> {
        const result = await this.tx.compConfig.findFirst();
        return result ? this.mapper.toConfigDomain(result) : null;
    }

    async saveConfig(config: CompConfig): Promise<CompConfig> {
        const data = this.mapper.toConfigPersistence(config);

        let result;
        if (data.id) {
            result = await this.tx.compConfig.update({
                where: { id: data.id },
                data: {
                    isEarnEnabled: data.isEarnEnabled,
                    isClaimEnabled: data.isClaimEnabled,
                    allowNegativeBalance: data.allowNegativeBalance,
                    minClaimAmount: data.minClaimAmount,
                    maxDailyEarnPerUser: data.maxDailyEarnPerUser,
                    expirationDays: data.expirationDays,
                    description: data.description,
                }
            });
        } else {
            // Ensure only one config exists or strictly update if ID provided
            // For simplicity, findFirst -> update or create
            const existing = await this.tx.compConfig.findFirst();
            if (existing) {
                result = await this.tx.compConfig.update({
                    where: { id: existing.id },
                    data: {
                        isEarnEnabled: data.isEarnEnabled,
                        isClaimEnabled: data.isClaimEnabled,
                        allowNegativeBalance: data.allowNegativeBalance,
                        minClaimAmount: data.minClaimAmount,
                        maxDailyEarnPerUser: data.maxDailyEarnPerUser,
                        expirationDays: data.expirationDays,
                        description: data.description,
                    }
                });
            } else {
                result = await this.tx.compConfig.create({
                    data: {
                        isEarnEnabled: data.isEarnEnabled ?? true,
                        isClaimEnabled: data.isClaimEnabled ?? true,
                        allowNegativeBalance: data.allowNegativeBalance ?? true,
                        minClaimAmount: data.minClaimAmount ?? new Prisma.Decimal(0.01),
                        maxDailyEarnPerUser: data.maxDailyEarnPerUser ?? new Prisma.Decimal(0),
                        expirationDays: data.expirationDays ?? 365,
                        description: data.description,
                    } as any
                });
            }
        }

        return this.mapper.toConfigDomain(result);
    }


    // CompClaimHistory Methods
    async saveHistory(history: CompClaimHistory): Promise<CompClaimHistory> {
        const data = this.mapper.toClaimHistoryPersistence(history);
        const result = await this.tx.compClaimHistory.upsert({
            where: { id: data.id ?? BigInt(0) }, // Use 0 for create if id is undefined/0
            create: {
                userId: data.userId!,
                status: data.status,
                failureReason: data.failureReason,
                compWalletTransactionId: data.compWalletTransactionId!,
                compAmount: data.compAmount!,
                compCurrency: data.compCurrency!,
                walletTransactionId: data.walletTransactionId,
                targetAmount: data.targetAmount!,
                targetCurrency: data.targetCurrency!,
                exchangeRate: data.exchangeRate!,
                claimedAt: data.claimedAt,
            },
            update: {
                status: data.status,
                failureReason: data.failureReason,
                walletTransactionId: data.walletTransactionId,
            }
        });
        return this.mapper.toClaimHistoryDomain(result);
    }

    async findHistoryById(id: bigint): Promise<CompClaimHistory | null> {
        const result = await this.tx.compClaimHistory.findUnique({
            where: { id },
        });
        return result ? this.mapper.toClaimHistoryDomain(result) : null;
    }

    async findHistoryByWalletTransactionId(walletTransactionId: bigint): Promise<CompClaimHistory | null> {
        const result = await this.tx.compClaimHistory.findUnique({
            where: { walletTransactionId },
        });
        return result ? this.mapper.toClaimHistoryDomain(result) : null;
    }
}

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { CompRepositoryPort } from '../ports';
import { CompAccount, CompAccountTransaction } from '../domain';
import { CompMapper } from './comp.mapper';

@Injectable()
export class CompAccountRepository implements CompRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CompMapper,
  ) { }

  async findByUserIdAndCurrency(
    userId: bigint,
    currency: ExchangeCurrencyCode,
  ): Promise<CompAccount | null> {
    const result = await this.tx.userCompAccount.findUnique({
      where: {
        userId_currency: {
          userId,
          currency,
        },
      },
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async save(account: CompAccount): Promise<CompAccount> {
    const data = this.mapper.toPersistence(account);

    const result = await this.tx.userCompAccount.upsert({
      where: {
        userId_currency: {
          userId: account.userId,
          currency: account.currency,
        },
      },
      create: {
        userId: account.userId,
        currency: account.currency,
        totalEarned: account.totalEarned,
        totalUsed: account.totalUsed,
        isFrozen: account.isFrozen,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
      },
      update: {
        totalEarned: account.totalEarned,
        totalUsed: account.totalUsed,
        isFrozen: account.isFrozen,
        updatedAt: account.updatedAt,
      },
    });

    return this.mapper.toDomain(result);
  }

  async createTransaction(
    transaction: CompAccountTransaction,
  ): Promise<CompAccountTransaction> {
    const data = this.mapper.toTransactionPersistence(transaction);
    const result = await this.tx.compAccountTransaction.create({
      data: data as any,
    });
    return this.mapper.toTransactionDomain(result);
  }

  async findTransactions(params: {
    userId: bigint;
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
    page: number;
    limit: number;
  }): Promise<{ data: CompAccountTransaction[]; total: number }> {
    const { userId, currency, startDate, endDate, page, limit } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.CompAccountTransactionWhereInput = {
      account: {
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
      this.tx.compAccountTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.tx.compAccountTransaction.count({ where }),
    ]);

    return {
      data: data.map((tx) => this.mapper.toTransactionDomain(tx)),
      total,
    };
  }

  async getStatsOverview(params: {
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ totalEarned: Prisma.Decimal; totalUsed: Prisma.Decimal }> {
    const { currency, startDate, endDate } = params;
    const where: Prisma.CompAccountTransactionWhereInput = {
      ...(currency && { account: { currency } }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    const earns = await this.tx.compAccountTransaction.aggregate({
      _sum: { amount: true },
      where: { ...where, amount: { gt: 0 } },
    });

    const claims = await this.tx.compAccountTransaction.aggregate({
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
  }): Promise<
    Array<{ date: string; earned: Prisma.Decimal; used: Prisma.Decimal }>
  > {
    const { currency, startDate, endDate } = params;
    const where: Prisma.CompAccountTransactionWhereInput = {
      ...(currency && { account: { currency } }),
      ...((startDate || endDate) && {
        createdAt: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      }),
    };

    const txs = await this.tx.compAccountTransaction.findMany({
      where,
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const dailyMap = new Map<
      string,
      { earned: Prisma.Decimal; used: Prisma.Decimal }
    >();
    txs.forEach((t) => {
      const dateStr = t.createdAt.toISOString().split('T')[0];
      const current = dailyMap.get(dateStr) || {
        earned: new Prisma.Decimal(0),
        used: new Prisma.Decimal(0),
      };
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
    const where: Prisma.CompAccountTransactionWhereInput = {
      amount: { gt: 0 },
      ...(currency && { account: { currency } }),
    };

    const groups = await this.tx.compAccountTransaction.groupBy({
      by: ['compAccountId'],
      _sum: { amount: true },
      where,
      orderBy: {
        _sum: { amount: 'desc' },
      },
      take: limit,
    });

    const results = await Promise.all(
      groups.map(async (g) => {
        const account = await this.tx.userCompAccount.findUnique({
          where: { id: g.compAccountId },
          select: { userId: true },
        });
        return {
          userId: account?.userId || BigInt(0),
          totalEarned: g._sum.amount || new Prisma.Decimal(0),
        };
      }),
    );

    return results;
  }
}

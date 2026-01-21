import { Injectable } from '@nestjs/common';
import {
    InjectTransaction,
} from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode } from '@prisma/client';
import { AnalyticsRepositoryPort } from '../ports/analytics.repository.port';
import { AnalyticsMapper } from './analytics.mapper';
import { UserHourlyStat, UserHourlyStatNotFoundException } from '../domain';

@Injectable()
export class AnalyticsRepository implements AnalyticsRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: AnalyticsMapper,
    ) { }

    async findByUserAndDate(
        userId: bigint,
        date: Date,
        currency: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat | null> {
        const model = await this.tx.userHourlyStat.findUnique({
            where: {
                userId_date_currency: {
                    userId,
                    date,
                    currency,
                },
            },
        });

        return model ? this.mapper.toDomain(model) : null;
    }

    async getByUserAndDate(
        userId: bigint,
        date: Date,
        currency: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat> {
        const stat = await this.findByUserAndDate(userId, date, currency);
        if (!stat) {
            throw new UserHourlyStatNotFoundException(userId, date, currency);
        }
        return stat;
    }

    async save(stat: UserHourlyStat): Promise<UserHourlyStat> {
        const data = this.mapper.toPrisma(stat);

        const model = await this.tx.userHourlyStat.upsert({
            where: {
                userId_date_currency: {
                    userId: data.userId,
                    date: data.date,
                    currency: data.currency,
                },
            },
            update: {
                totalDeposit: data.totalDeposit,
                totalWithdraw: data.totalWithdraw,
                depositCount: data.depositCount,
                withdrawCount: data.withdrawCount,
                totalBonusGiven: data.totalBonusGiven,
                totalBonusUsed: data.totalBonusUsed,
                totalBonusConverted: data.totalBonusConverted,
                totalBet: data.totalBet,
                totalWin: data.totalWin,
                netWin: data.netWin,
                ggr: data.ggr,
                totalGameCount: data.totalGameCount,
                slotBetAmount: data.slotBetAmount,
                slotWinAmount: data.slotWinAmount,
                slotGgr: data.slotGgr,
                slotGameCount: data.slotGameCount,
                liveBetAmount: data.liveBetAmount,
                liveWinAmount: data.liveWinAmount,
                liveGgr: data.liveGgr,
                liveGameCount: data.liveGameCount,
                totalCompEarned: data.totalCompEarned,
                startBalance: data.startBalance,
                endBalance: data.endBalance,
                startBonusBalance: data.startBonusBalance,
                endBonusBalance: data.endBonusBalance,
            },
            create: data,
        });

        return this.mapper.toDomain(model);
    }

    async findStatsByUserAndPeriod(
        userId: bigint,
        startAt: Date,
        endAt: Date,
        currency?: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat[]> {
        const models = await this.tx.userHourlyStat.findMany({
            where: {
                userId,
                date: {
                    gte: startAt,
                    lte: endAt,
                },
                ...(currency ? { currency } : {}),
            },
            orderBy: {
                date: 'asc',
            },
        });

        return models.map((model) => this.mapper.toDomain(model));
    }
}

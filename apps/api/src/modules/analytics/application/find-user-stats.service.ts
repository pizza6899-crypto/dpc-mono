import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@repo/database';
import { ANALYTICS_REPOSITORY } from '../ports/analytics.repository.token';
import type { AnalyticsRepositoryPort } from '../ports/analytics.repository.port';
import { UserHourlyStat } from '../domain/model/user-hourly-stat.entity';

export interface AggregatedStat {
    totalDeposit: Prisma.Decimal;
    totalWithdraw: Prisma.Decimal;
    depositCount: number;
    withdrawCount: number;
    totalBet: Prisma.Decimal;
    totalWin: Prisma.Decimal;
    netWin: Prisma.Decimal;
    ggr: Prisma.Decimal;
    totalGameCount: number;
    // ... other aggregated fields as needed
}

@Injectable()
export class FindUserStatsService {
    constructor(
        @Inject(ANALYTICS_REPOSITORY)
        private readonly repository: AnalyticsRepositoryPort,
    ) { }

    async findHourlyStats(
        userId: bigint,
        startAt: Date,
        endAt: Date,
        currency?: ExchangeCurrencyCode,
    ): Promise<UserHourlyStat[]> {
        return this.repository.findStatsByUserAndPeriod(
            userId,
            startAt,
            endAt,
            currency,
        );
    }

    async findAggregatedStats(
        userId: bigint,
        startAt: Date,
        endAt: Date,
        currency: ExchangeCurrencyCode,
    ): Promise<AggregatedStat> {
        const stats = await this.repository.findStatsByUserAndPeriod(
            userId,
            startAt,
            endAt,
            currency,
        );

        const zero = new Prisma.Decimal(0);
        const aggregated: AggregatedStat = {
            totalDeposit: zero,
            totalWithdraw: zero,
            depositCount: 0,
            withdrawCount: 0,
            totalBet: zero,
            totalWin: zero,
            netWin: zero,
            ggr: zero,
            totalGameCount: 0,
        };

        for (const stat of stats) {
            aggregated.totalDeposit = aggregated.totalDeposit.add(stat.totalDeposit);
            aggregated.totalWithdraw = aggregated.totalWithdraw.add(
                stat.totalWithdraw,
            );
            aggregated.depositCount += stat.depositCount;
            aggregated.withdrawCount += stat.withdrawCount;
            aggregated.totalBet = aggregated.totalBet.add(stat.totalBet);
            aggregated.totalWin = aggregated.totalWin.add(stat.totalWin);
            aggregated.netWin = aggregated.netWin.add(stat.netWin);
            aggregated.ggr = aggregated.ggr.add(stat.ggr);
            aggregated.totalGameCount += stat.totalGameCount;
        }

        return aggregated;
    }
}

import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';

interface FindAdminCompStatsParams {
    currency: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
}

@Injectable()
export class FindAdminCompStatsService {
    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
    ) { }

    async execute(params: FindAdminCompStatsParams) {
        const [overview, daily] = await Promise.all([
            this.compRepository.getStatsOverview(params),
            this.compRepository.getDailyStats(params),
        ]);

        let conversionRate = '0.0%';
        if (overview.totalEarned.gt(0)) {
            conversionRate =
                overview.totalUsed.div(overview.totalEarned).mul(100).toFixed(1) + '%';
        }

        return {
            summary: {
                totalEarned: overview.totalEarned.toString(),
                totalUsed: overview.totalUsed.toString(),
                conversionRate,
            },
            daily: daily.map((s) => ({
                date: s.date,
                earned: s.earned.toString(),
                used: s.used.toString(),
            })),
        };
    }
}

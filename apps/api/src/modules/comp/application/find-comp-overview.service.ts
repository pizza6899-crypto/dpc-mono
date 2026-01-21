import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';

interface FindCompOverviewParams {
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
}

@Injectable()
export class FindCompOverviewService {
    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
    ) { }

    async execute(params: FindCompOverviewParams) {
        const stats = await this.compRepository.getStatsOverview(params);

        let conversionRate = '0.0%';
        if (stats.totalEarned.gt(0)) {
            conversionRate = stats.totalUsed.div(stats.totalEarned).mul(100).toFixed(1) + '%';
        }

        return {
            totalEarned: stats.totalEarned.toString(),
            totalUsed: stats.totalUsed.toString(),
            conversionRate,
        };
    }
}

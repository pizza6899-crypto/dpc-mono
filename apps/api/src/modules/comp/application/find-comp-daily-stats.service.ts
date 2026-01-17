import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';

interface FindCompDailyStatsParams {
    currency?: ExchangeCurrencyCode;
    startDate?: Date;
    endDate?: Date;
}

@Injectable()
export class FindCompDailyStatsService {
    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
    ) { }

    async execute(params: FindCompDailyStatsParams) {
        const stats = await this.compRepository.getDailyStats(params);
        return stats.map(s => ({
            date: s.date,
            earned: s.earned.toString(),
            used: s.used.toString(),
        }));
    }
}

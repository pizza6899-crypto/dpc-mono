import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { COMP_REPOSITORY } from '../ports/repository.token';
import type { CompRepositoryPort } from '../ports';

interface FindCompTopEarnersParams {
    currency?: ExchangeCurrencyCode;
    limit?: number;
}

@Injectable()
export class FindCompTopEarnersService {
    constructor(
        @Inject(COMP_REPOSITORY)
        private readonly compRepository: CompRepositoryPort,
    ) { }

    async execute(params: FindCompTopEarnersParams) {
        const limit = params.limit || 10;
        const stats = await this.compRepository.getTopEarners({ ...params, limit });
        return stats.map(s => ({
            userId: s.userId.toString(),
            totalEarned: s.totalEarned.toString(),
        }));
    }
}

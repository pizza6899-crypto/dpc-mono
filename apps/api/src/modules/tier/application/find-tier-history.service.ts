import { Inject, Injectable } from '@nestjs/common';
import { TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';

interface FindTierHistoryParams {
    userId?: bigint;
    page: number;
    limit: number;
}

@Injectable()
export class FindTierHistoryService {
    constructor(
        @Inject(TIER_HISTORY_REPOSITORY)
        private readonly repository: TierHistoryRepositoryPort,
    ) { }

    async execute(params: FindTierHistoryParams) {
        return this.repository.findHistory(params);
    }
}

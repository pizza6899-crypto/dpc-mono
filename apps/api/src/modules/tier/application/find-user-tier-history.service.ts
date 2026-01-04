import { Inject, Injectable } from '@nestjs/common';
import { TIER_HISTORY_REPOSITORY } from '../ports/repository.token';
import type { TierHistoryRepositoryPort } from '../ports/tier-history.repository.port';
import { TierHistory } from '../domain/model/tier-history.entity';

@Injectable()
export class FindUserTierHistoryService {
    constructor(
        @Inject(TIER_HISTORY_REPOSITORY)
        private readonly tierHistoryRepository: TierHistoryRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<TierHistory[]> {
        return this.tierHistoryRepository.findByUserId(userId);
    }
}

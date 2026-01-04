import { Inject, Injectable } from '@nestjs/common';
import { TIER_REPOSITORY } from '../../ports/repository.token';
import type { TierRepositoryPort } from '../../ports/tier.repository.port';

@Injectable()
export class UpdateTierTranslationService {
    constructor(
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(tierId: bigint, language: string, name: string): Promise<void> {
        return this.tierRepository.saveTranslation(tierId, language, name);
    }
}


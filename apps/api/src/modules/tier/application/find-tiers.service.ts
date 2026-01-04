import { Inject, Injectable } from '@nestjs/common';
import { Tier } from '../domain';
import type { TierRepositoryPort } from '../ports/tier.repository.port';
import { TIER_REPOSITORY } from '../ports/repository.token';

@Injectable()
export class FindTiersService {
    constructor(
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(): Promise<Tier[]> {
        return this.tierRepository.findAll();
    }
}

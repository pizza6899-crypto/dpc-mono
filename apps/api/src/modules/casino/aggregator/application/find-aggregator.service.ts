import { Inject, Injectable } from '@nestjs/common';
import { CasinoAggregator } from '../domain';
import { CASINO_AGGREGATOR_REPOSITORY } from '../ports';
import type { CasinoAggregatorRepositoryPort } from '../ports';

@Injectable()
export class FindAggregatorService {
    constructor(
        @Inject(CASINO_AGGREGATOR_REPOSITORY)
        private readonly repository: CasinoAggregatorRepositoryPort,
    ) { }

    async execute({ id }: { id: bigint }): Promise<CasinoAggregator> {
        return this.repository.getById(id);
    }
}

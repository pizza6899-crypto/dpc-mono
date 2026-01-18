import { Inject, Injectable } from '@nestjs/common';
import { CasinoAggregator, AggregatorConfig } from '../domain';
import { CASINO_AGGREGATOR_REPOSITORY } from '../ports';
import type { CasinoAggregatorRepositoryPort } from '../ports';
import { AggregatorStatus } from '@repo/database';

interface CreateAggregatorCommand {
    name: string;
    code: string;
    config: AggregatorConfig;
    status: AggregatorStatus;
}

@Injectable()
export class CreateAggregatorService {
    constructor(
        @Inject(CASINO_AGGREGATOR_REPOSITORY)
        private readonly repository: CasinoAggregatorRepositoryPort,
    ) { }

    async execute(command: CreateAggregatorCommand): Promise<CasinoAggregator> {
        const aggregator = CasinoAggregator.create(command);
        return this.repository.create(aggregator);
    }
}

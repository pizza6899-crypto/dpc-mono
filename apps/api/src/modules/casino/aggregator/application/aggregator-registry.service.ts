import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { CASINO_AGGREGATOR_REPOSITORY } from '../ports';
import type { CasinoAggregatorRepositoryPort } from '../ports';
import {
    CasinoAggregator,
    CasinoAggregatorNotFoundException,
    CasinoAggregatorInactiveException,
    CasinoAggregatorMaintenanceException,
} from '../domain';

@Injectable()
export class AggregatorRegistryService implements OnModuleInit {
    private readonly logger = new Logger(AggregatorRegistryService.name);
    private aggregators = new Map<string, CasinoAggregator>();

    constructor(
        @Inject(CASINO_AGGREGATOR_REPOSITORY)
        private readonly repository: CasinoAggregatorRepositoryPort,
    ) { }

    async onModuleInit(): Promise<void> {
        await this.reload();
    }

    async reload(): Promise<void> {
        const activeAggregators = await this.repository.findAllActive();
        this.aggregators.clear();
        for (const agg of activeAggregators) {
            this.aggregators.set(agg.code, agg);
        }
        this.logger.log(`Loaded ${this.aggregators.size} active aggregators`);
    }

    get(code: string): CasinoAggregator {
        const aggregator = this.aggregators.get(code);
        if (!aggregator) {
            throw new CasinoAggregatorNotFoundException(code);
        }
        return aggregator;
    }

    getOrThrowIfUnavailable(code: string): CasinoAggregator {
        const aggregator = this.get(code);
        if (!aggregator.isActive()) {
            if (aggregator.isMaintenance()) {
                throw new CasinoAggregatorMaintenanceException(code);
            }
            throw new CasinoAggregatorInactiveException(code);
        }
        return aggregator;
    }

    getAll(): CasinoAggregator[] {
        return Array.from(this.aggregators.values());
    }
}

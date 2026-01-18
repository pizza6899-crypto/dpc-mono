import { AggregatorStatus } from '@repo/database';
import { AggregatorConfig } from './aggregator-config.vo';

export class CasinoAggregator {
    private constructor(
        public readonly id: bigint | null,
        public readonly name: string,
        public readonly code: string,
        public readonly status: AggregatorStatus,
        public readonly config: AggregatorConfig,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        id?: bigint;
        name: string;
        code: string;
        status?: AggregatorStatus;
        config: AggregatorConfig;
        createdAt?: Date;
        updatedAt?: Date;
    }): CasinoAggregator {
        return new CasinoAggregator(
            params.id ?? null,
            params.name,
            params.code,
            params.status ?? AggregatorStatus.ACTIVE,
            params.config,
            params.createdAt ?? new Date(),
            params.updatedAt ?? new Date(),
        );
    }

    isActive(): boolean {
        return this.status === AggregatorStatus.ACTIVE;
    }

    isMaintenance(): boolean {
        return this.status === AggregatorStatus.MAINTENANCE;
    }
}

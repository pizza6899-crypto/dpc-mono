import { AggregatorStatus } from '@repo/database';

export class CasinoAggregator {
    static readonly CODE_DC = 'DC';
    static readonly CODE_WC = 'WC';

    private constructor(
        public readonly id: bigint | null,
        public readonly name: string,
        public readonly code: string,
        public readonly status: AggregatorStatus,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(params: {
        id?: bigint;
        name: string;
        code: string;
        status?: AggregatorStatus;
        createdAt?: Date;
        updatedAt?: Date;
    }): CasinoAggregator {
        return new CasinoAggregator(
            params.id ?? null,
            params.name,
            params.code,
            params.status ?? AggregatorStatus.ACTIVE,
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

    isDc(): boolean {
        return this.code === CasinoAggregator.CODE_DC;
    }

    isWhitecliff(): boolean {
        return this.code === CasinoAggregator.CODE_WC;
    }
}

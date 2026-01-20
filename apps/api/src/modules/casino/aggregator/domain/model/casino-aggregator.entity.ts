import { AggregatorStatus, GameAggregatorType } from '@repo/database';
import { AGGREGATOR_CODE_MAP } from '../../ports/aggregator-game.dto';

export class CasinoAggregator {
    private constructor(
        public readonly id: bigint | null,
        public readonly name: string,
        public readonly code: string,
        public readonly status: AggregatorStatus,
        public readonly apiEnabled: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static readonly CODE_DC = AGGREGATOR_CODE_MAP[GameAggregatorType.DC];
    static readonly CODE_WC = AGGREGATOR_CODE_MAP[GameAggregatorType.WHITECLIFF];

    static create(params: {
        id?: bigint;
        name: string;
        code: string;
        status?: AggregatorStatus;
        apiEnabled?: boolean;
        createdAt?: Date;
        updatedAt?: Date;
    }): CasinoAggregator {
        return new CasinoAggregator(
            params.id ?? null,
            params.name,
            params.code,
            params.status ?? AggregatorStatus.ACTIVE,
            params.apiEnabled ?? true,
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

    /**
     * 최종적으로 API 통신이 가능한 상태인지 확인
     * (DB 상태가 활성이고 + API 스위치가 켜져 있어야 함)
     */
    canCallApi(): boolean {
        return this.isActive() && this.apiEnabled;
    }

    isDc(): boolean {
        return this.code === AGGREGATOR_CODE_MAP[GameAggregatorType.DC];
    }

    isWhitecliff(): boolean {
        return this.code === AGGREGATOR_CODE_MAP[GameAggregatorType.WHITECLIFF];
    }
}

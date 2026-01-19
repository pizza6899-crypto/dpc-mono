import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { CASINO_AGGREGATOR_REPOSITORY } from '../ports';
import type { CasinoAggregatorRepositoryPort } from '../ports';
import {
    CasinoAggregator,
    CasinoAggregatorNotFoundException,
    CasinoAggregatorInactiveException,
    CasinoAggregatorMaintenanceException,
} from '../domain';
import { EnvService } from 'src/common/env/env.service';
import {
    DcsAggregatorConfig,
    WhitecliffAggregatorConfig,
    createDcsAggregatorConfig,
    createWhitecliffAggregatorConfig,
} from '../domain/model/aggregator-config';

@Injectable()
export class AggregatorRegistryService implements OnModuleInit {
    private readonly logger = new Logger(AggregatorRegistryService.name);
    private aggregators = new Map<string, CasinoAggregator>();

    constructor(
        @Inject(CASINO_AGGREGATOR_REPOSITORY)
        private readonly repository: CasinoAggregatorRepositoryPort,
        private readonly envService: EnvService,
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

    /**
     * 애그리게이터 메타 정보(DB) 조회
     */
    get(code: string): CasinoAggregator {
        const aggregator = this.aggregators.get(code);
        if (!aggregator) {
            throw new CasinoAggregatorNotFoundException(code);
        }
        return aggregator;
    }

    /**
     * 애그리게이터가 사용 가능한 상태인지 확인 후 반환
     */
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

    // ============================================================
    // 통합 설정 접근 (DB 메타 + Env 설정 결합)
    // ============================================================

    /**
     * DCS 통합 설정을 반환합니다.
     * DB 상태 검증 + Env 설정을 결합한 단일 객체.
     */
    getDcs(): DcsAggregatorConfig {
        const aggregator = this.getOrThrowIfUnavailable(CasinoAggregator.CODE_DC);

        if (!aggregator.apiEnabled) {
            throw new CasinoAggregatorInactiveException(CasinoAggregator.CODE_DC);
        }

        return createDcsAggregatorConfig(
            {
                id: aggregator.id!,
                code: aggregator.code,
                name: aggregator.name,
                status: aggregator.status,
                apiEnabled: aggregator.apiEnabled,
            },
            this.envService.dcs,
        );
    }

    /**
     * Whitecliff 통합 설정을 반환합니다 (특정 통화).
     * DB 상태 검증 + Env 설정을 결합한 단일 객체.
     */
    getWhitecliff(currency: string): WhitecliffAggregatorConfig {
        const aggregator = this.getOrThrowIfUnavailable(CasinoAggregator.CODE_WC);

        if (!aggregator.apiEnabled) {
            throw new CasinoAggregatorInactiveException(CasinoAggregator.CODE_WC);
        }

        const envConfig = this.envService.whitecliff.find(wc => wc.currency === currency);
        if (!envConfig) {
            throw new Error(`Whitecliff configuration for currency '${currency}' not found.`);
        }

        return createWhitecliffAggregatorConfig(
            {
                id: aggregator.id!,
                code: aggregator.code,
                name: aggregator.name,
                status: aggregator.status,
                apiEnabled: aggregator.apiEnabled,
            },
            envConfig,
        );
    }

    /**
     * 모든 Whitecliff 통합 설정을 반환합니다.
     * DB 상태 검증 + 각 통화별 Env 설정을 결합한 배열.
     */
    getAllWhitecliff(): WhitecliffAggregatorConfig[] {
        const aggregator = this.getOrThrowIfUnavailable(CasinoAggregator.CODE_WC);

        if (!aggregator.apiEnabled) {
            throw new CasinoAggregatorInactiveException(CasinoAggregator.CODE_WC);
        }

        return this.envService.whitecliff.map(envConfig =>
            createWhitecliffAggregatorConfig(
                {
                    id: aggregator.id!,
                    code: aggregator.code,
                    name: aggregator.name,
                    status: aggregator.status,
                    apiEnabled: aggregator.apiEnabled,
                },
                envConfig,
            ),
        );
    }
}

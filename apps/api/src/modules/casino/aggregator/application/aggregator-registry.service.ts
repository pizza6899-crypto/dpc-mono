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
import type { DcsConfig, WhitecliffConfig } from 'src/common/env/env.types';

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
    // API 설정 접근 (EnvService에서 가져옴)
    // ============================================================

    /**
     * DCS(DC) API 설정 조회
     */
    getDcsConfig(): DcsConfig {
        return this.envService.dcs;
    }

    /**
     * Whitecliff 설정 목록 조회 (통화별)
     */
    getWhitecliffConfigs(): WhitecliffConfig[] {
        return this.envService.whitecliff;
    }

    /**
     * 특정 통화에 해당하는 Whitecliff 설정 조회
     */
    getWhitecliffConfigByCurrency(currency: string): WhitecliffConfig | undefined {
        return this.envService.whitecliff.find(wc => wc.currency === currency);
    }
}

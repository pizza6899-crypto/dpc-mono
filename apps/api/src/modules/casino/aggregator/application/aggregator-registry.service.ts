import { Injectable, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { CASINO_AGGREGATOR_REPOSITORY } from '../ports';
import type { CasinoAggregatorRepositoryPort } from '../ports';
import {
  CasinoAggregator,
  CasinoAggregatorNotFoundException,
  CasinoAggregatorInactiveException,
  CasinoAggregatorMaintenanceException,
} from '../domain';
import { EnvService } from 'src/infrastructure/env/env.service';
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
  ) {}

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
      throw new CasinoAggregatorNotFoundException();
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
        throw new CasinoAggregatorMaintenanceException();
      }
      throw new CasinoAggregatorInactiveException();
    }
    return aggregator;
  }

  getAll(): CasinoAggregator[] {
    return Array.from(this.aggregators.values());
  }

  getById(id: bigint): CasinoAggregator {
    const aggregator = Array.from(this.aggregators.values()).find(
      (agg) => agg.id === id,
    );
    if (!aggregator) {
      throw new CasinoAggregatorNotFoundException();
    }
    return aggregator;
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
      throw new CasinoAggregatorInactiveException();
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
   * Whitecliff 통합 설정을 반환합니다 (특정 내부 통화).
   * DB 상태 검증 + Env 설정을 결합한 단일 객체.
   * @param internalCurrency 내부 시스템 통화 코드 (예: USDT)
   */
  getWhitecliff(internalCurrency: string): WhitecliffAggregatorConfig {
    const aggregator = this.getOrThrowIfUnavailable(CasinoAggregator.CODE_WC);

    if (!aggregator.apiEnabled) {
      throw new CasinoAggregatorInactiveException();
    }

    // 모든 Env 설정을 통합 객체로 먼저 변환 (매핑 로직 적용을 위해)
    const fullConfigs = this.envService.whitecliff.map((env) =>
      createWhitecliffAggregatorConfig(
        {
          id: aggregator.id!,
          code: aggregator.code,
          name: aggregator.name,
          status: aggregator.status,
          apiEnabled: aggregator.apiEnabled,
        },
        env,
      ),
    );

    // 변환된 객체 중에서 내부 통화 코드가 일치하는 것을 탐색
    const config = fullConfigs.find(
      (c) => c.internalCurrency === internalCurrency,
    );

    if (!config) {
      throw new Error(
        `Whitecliff configuration for internal currency '${internalCurrency}' not found.`,
      );
    }

    return config;
  }

  /**
   * 모든 Whitecliff 통합 설정을 반환합니다.
   * DB 상태 검증 + 각 통화별 Env 설정을 결합한 배열.
   */
  getAllWhitecliff(): WhitecliffAggregatorConfig[] {
    const aggregator = this.getOrThrowIfUnavailable(CasinoAggregator.CODE_WC);

    if (!aggregator.apiEnabled) {
      throw new CasinoAggregatorInactiveException();
    }

    return this.envService.whitecliff.map((envConfig) =>
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

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { CompConfigRepositoryPort } from '../ports';
import { CompConfig } from '../domain';
import { CompMapper } from './comp.mapper';

@Injectable()
export class CompConfigRepository implements CompConfigRepositoryPort {
  private readonly configCache = new Map<
    ExchangeCurrencyCode,
    { config: CompConfig; timestamp: number }
  >();
  private readonly CACHE_TTL = 60 * 1000; // 1분 캐시

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CompMapper,
  ) {}

  async getConfig(currency: ExchangeCurrencyCode): Promise<CompConfig | null> {
    const cached = this.configCache.get(currency);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.config;
    }

    const result = await this.tx.compConfig.findUnique({
      where: { currency },
    });

    if (result) {
      const domainConfig = this.mapper.toConfigDomain(result);
      this.configCache.set(currency, { config: domainConfig, timestamp: now });
      return domainConfig;
    }

    return null;
  }

  async getAllConfigs(): Promise<CompConfig[]> {
    const results = await this.tx.compConfig.findMany({
      orderBy: { currency: 'asc' },
    });
    return results.map((result) => this.mapper.toConfigDomain(result));
  }

  async save(config: CompConfig): Promise<CompConfig> {
    const data = this.mapper.toConfigPersistence(config);

    const result = await this.tx.compConfig.upsert({
      where: { currency: config.currency },
      create: {
        currency: data.currency!,
        isEarnEnabled: data.isEarnEnabled ?? true,
        isClaimEnabled: data.isClaimEnabled ?? true,
        allowNegativeBalance: data.allowNegativeBalance ?? true,
        minClaimAmount: data.minClaimAmount ?? new Prisma.Decimal(0.01),
        maxDailyEarnPerUser: data.maxDailyEarnPerUser ?? new Prisma.Decimal(0),
        expirationDays: data.expirationDays ?? 365,
        description: data.description,
      },
      update: {
        isEarnEnabled: data.isEarnEnabled,
        isClaimEnabled: data.isClaimEnabled,
        allowNegativeBalance: data.allowNegativeBalance,
        minClaimAmount: data.minClaimAmount,
        maxDailyEarnPerUser: data.maxDailyEarnPerUser,
        expirationDays: data.expirationDays,
        description: data.description,
      },
    });

    // 캐시 무효화 (다음 조회 시 최신 정보를 읽도록)
    this.configCache.delete(config.currency);

    return this.mapper.toConfigDomain(result);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import {
  CasinoGameProviderRepositoryPort,
  ListProvidersOptions,
} from '../ports/casino-game-provider.repository.port';
import { CasinoGameProviderMapper } from './casino-game-provider.mapper';
// Note: You might need to define a specific exception for Provider not found, or reuse a generic one.
// For now I'll assume we can use a generic DomainException or similar if needed,
// but based on valid patterns, I should throw a specific exception in 'get'.
import {
  CasinoGameProvider,
  CasinoGameProviderNotFoundException,
} from '../domain';
import { CacheService } from 'src/infrastructure/cache/cache.service';
import { CACHE_CONFIG } from 'src/infrastructure/cache/cache.constants';

@Injectable()
export class CasinoGameProviderRepository implements CasinoGameProviderRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CasinoGameProviderMapper,
    private readonly cacheService: CacheService,
  ) {}

  async create(provider: CasinoGameProvider): Promise<CasinoGameProvider> {
    const data = this.mapper.toPrisma(provider);
    const created = await this.tx.casinoGameProvider.create({
      data,
    });
    return this.mapper.toDomain(created);
  }

  async update(provider: CasinoGameProvider): Promise<CasinoGameProvider> {
    const data = this.mapper.toPrisma(provider);
    const updated = await this.tx.casinoGameProvider.update({
      where: { id: provider.id! },
      data,
    });
    const domain = this.mapper.toDomain(updated);

    // 캐시 무효화
    await Promise.all([
      this.cacheService.del(CACHE_CONFIG.CASINO.PROVIDER.BY_ID(domain.id!)),
      this.cacheService.del(
        CACHE_CONFIG.CASINO.PROVIDER.BY_CODE(domain.aggregatorId, domain.code),
      ),
      this.cacheService.del(
        CACHE_CONFIG.CASINO.PROVIDER.BY_EXTERNAL_ID(
          domain.aggregatorId,
          domain.externalId,
        ),
      ),
    ]);

    return domain;
  }

  async findById(id: bigint): Promise<CasinoGameProvider | null> {
    return this.cacheService.getOrSet(
      CACHE_CONFIG.CASINO.PROVIDER.BY_ID(id),
      async () => {
        const found = await this.tx.casinoGameProvider.findUnique({
          where: { id },
        });
        return found ? this.mapper.toDomain(found) : null;
      },
    );
  }

  async getById(id: bigint): Promise<CasinoGameProvider> {
    const provider = await this.findById(id);
    if (!provider) {
      throw new CasinoGameProviderNotFoundException();
    }
    return provider;
  }

  async findByCode(
    aggregatorId: bigint,
    code: string,
  ): Promise<CasinoGameProvider | null> {
    return this.cacheService.getOrSet(
      CACHE_CONFIG.CASINO.PROVIDER.BY_CODE(aggregatorId, code),
      async () => {
        const found = await this.tx.casinoGameProvider.findUnique({
          where: {
            aggregatorId_code: {
              aggregatorId,
              code,
            },
          },
        });
        return found ? this.mapper.toDomain(found) : null;
      },
    );
  }

  async findByExternalId(
    aggregatorId: bigint,
    externalId: string,
  ): Promise<CasinoGameProvider | null> {
    return this.cacheService.getOrSet(
      CACHE_CONFIG.CASINO.PROVIDER.BY_EXTERNAL_ID(aggregatorId, externalId),
      async () => {
        const found = await this.tx.casinoGameProvider.findUnique({
          where: {
            aggregatorId_externalId: {
              aggregatorId,
              externalId,
            },
          },
        });
        return found ? this.mapper.toDomain(found) : null;
      },
    );
  }

  async list(options?: ListProvidersOptions): Promise<CasinoGameProvider[]> {
    const where: any = {};
    if (options?.aggregatorId) {
      where.aggregatorId = options.aggregatorId;
    }

    const found = await this.tx.casinoGameProvider.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    return found.map((p) => this.mapper.toDomain(p));
  }
}

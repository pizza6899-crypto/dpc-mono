import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CasinoAggregatorRepositoryPort } from '../ports/casino-aggregator.repository.port';
import { CasinoAggregator, CasinoAggregatorNotFoundException } from '../domain';
import { CasinoAggregatorMapper } from './casino-aggregator.mapper';
import { AggregatorStatus } from '@prisma/client';
import { CacheService } from 'src/infrastructure/cache/cache.service';
import { CACHE_CONFIG } from 'src/infrastructure/cache/cache.constants';

@Injectable()
export class CasinoAggregatorRepository implements CasinoAggregatorRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CasinoAggregatorMapper,
    private readonly cacheService: CacheService,
  ) {}

  async findById(id: bigint): Promise<CasinoAggregator | null> {
    return this.cacheService.getOrSet(
      CACHE_CONFIG.CASINO.AGGREGATOR.BY_ID(id),
      async () => {
        const result = await this.tx.casinoAggregator.findUnique({
          where: { id },
        });
        return result ? this.mapper.toDomain(result) : null;
      },
    );
  }

  async getById(id: bigint): Promise<CasinoAggregator> {
    const aggregator = await this.findById(id);
    if (!aggregator) throw new CasinoAggregatorNotFoundException();
    return aggregator;
  }

  async findByCode(code: string): Promise<CasinoAggregator | null> {
    return this.cacheService.getOrSet(
      CACHE_CONFIG.CASINO.AGGREGATOR.BY_CODE(code),
      async () => {
        const result = await this.tx.casinoAggregator.findUnique({
          where: { code },
        });
        return result ? this.mapper.toDomain(result) : null;
      },
    );
  }

  async getByCode(code: string): Promise<CasinoAggregator> {
    const aggregator = await this.findByCode(code);
    if (!aggregator) throw new CasinoAggregatorNotFoundException();
    return aggregator;
  }

  async findAll(): Promise<CasinoAggregator[]> {
    const results = await this.tx.casinoAggregator.findMany();
    return results.map((r) => this.mapper.toDomain(r));
  }

  async findAllActive(): Promise<CasinoAggregator[]> {
    const results = await this.tx.casinoAggregator.findMany({
      where: { status: AggregatorStatus.ACTIVE },
    });
    return results.map((r) => this.mapper.toDomain(r));
  }

  async create(aggregator: CasinoAggregator): Promise<CasinoAggregator> {
    const data = this.mapper.toPrisma(aggregator);
    const result = await this.tx.casinoAggregator.create({ data });
    return this.mapper.toDomain(result);
  }

  async update(aggregator: CasinoAggregator): Promise<CasinoAggregator> {
    const data = this.mapper.toPrisma(aggregator);
    const result = await this.tx.casinoAggregator.update({
      where: { id: aggregator.id! },
      data,
    });
    const domain = this.mapper.toDomain(result);

    // 캐시 무효화: ID와 Code 둘 다 삭제
    await Promise.all([
      this.cacheService.del(CACHE_CONFIG.CASINO.AGGREGATOR.BY_ID(domain.id!)),
      this.cacheService.del(
        CACHE_CONFIG.CASINO.AGGREGATOR.BY_CODE(domain.code),
      ),
    ]);

    return domain;
  }
}

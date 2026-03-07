import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CasinoAggregatorRepositoryPort } from '../ports/casino-aggregator.repository.port';
import { CasinoAggregator, CasinoAggregatorNotFoundException } from '../domain';
import { CasinoAggregatorMapper } from './casino-aggregator.mapper';
import { AggregatorStatus } from '@prisma/client';

@Injectable()
export class CasinoAggregatorRepository implements CasinoAggregatorRepositoryPort {
  private readonly cacheById = new Map<
    bigint,
    { data: CasinoAggregator; timestamp: number }
  >();
  private readonly cacheByCode = new Map<
    string,
    { data: CasinoAggregator; timestamp: number }
  >();
  private readonly CACHE_TTL = 60 * 1000; // 1분 캐시

  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly mapper: CasinoAggregatorMapper,
  ) { }

  async findById(id: bigint): Promise<CasinoAggregator | null> {
    const cached = this.cacheById.get(id);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const result = await this.tx.casinoAggregator.findUnique({ where: { id } });
    if (result) {
      const domain = this.mapper.toDomain(result);
      this.updateCache(domain);
      return domain;
    }
    return null;
  }

  private updateCache(aggregator: CasinoAggregator): void {
    const now = Date.now();
    if (aggregator.id) {
      this.cacheById.set(aggregator.id, { data: aggregator, timestamp: now });
    }
    this.cacheByCode.set(aggregator.code, { data: aggregator, timestamp: now });
  }

  private clearCache(aggregator: CasinoAggregator): void {
    if (aggregator.id) {
      this.cacheById.delete(aggregator.id);
    }
    this.cacheByCode.delete(aggregator.code);
  }

  async getById(id: bigint): Promise<CasinoAggregator> {
    const aggregator = await this.findById(id);
    if (!aggregator) throw new CasinoAggregatorNotFoundException();
    return aggregator;
  }

  async findByCode(code: string): Promise<CasinoAggregator | null> {
    const cached = this.cacheByCode.get(code);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const result = await this.tx.casinoAggregator.findUnique({
      where: { code },
    });
    if (result) {
      const domain = this.mapper.toDomain(result);
      this.updateCache(domain);
      return domain;
    }
    return null;
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

    // 캐시 무효화: 다음 조회 시 DB에서 최신 데이터를 읽어오도록 함
    this.clearCache(domain);

    return domain;
  }
}

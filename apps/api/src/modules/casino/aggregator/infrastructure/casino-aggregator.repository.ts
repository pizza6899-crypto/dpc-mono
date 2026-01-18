import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CasinoAggregatorRepositoryPort } from '../ports/casino-aggregator.repository.port';
import { CasinoAggregator, CasinoAggregatorNotFoundException } from '../domain';
import { CasinoAggregatorMapper } from './casino-aggregator.mapper';
import { AggregatorStatus } from '@repo/database';

@Injectable()
export class CasinoAggregatorRepository implements CasinoAggregatorRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CasinoAggregatorMapper,
    ) { }

    async findById(id: bigint): Promise<CasinoAggregator | null> {
        const result = await this.tx.casinoAggregator.findUnique({ where: { id } });
        return result ? this.mapper.toDomain(result) : null;
    }

    async getById(id: bigint): Promise<CasinoAggregator> {
        const aggregator = await this.findById(id);
        if (!aggregator) throw new CasinoAggregatorNotFoundException(id);
        return aggregator;
    }

    async findByCode(code: string): Promise<CasinoAggregator | null> {
        const result = await this.tx.casinoAggregator.findUnique({ where: { code } });
        return result ? this.mapper.toDomain(result) : null;
    }

    async getByCode(code: string): Promise<CasinoAggregator> {
        const aggregator = await this.findByCode(code);
        if (!aggregator) throw new CasinoAggregatorNotFoundException(code);
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
        return this.mapper.toDomain(result);
    }
}

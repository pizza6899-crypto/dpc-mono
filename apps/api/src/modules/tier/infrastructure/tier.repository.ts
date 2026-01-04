import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { Transaction } from '@nestjs-cls/transactional';
import type { TransactionalAdapterPrisma } from '@nestjs-cls/transactional-adapter-prisma';
import { TierRepositoryPort } from '../ports/tier.repository.port';
import { TierMapper } from './tier.mapper';
import { Tier } from '../domain';

@Injectable()
export class TierRepository implements TierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: Transaction<TransactionalAdapterPrisma>,
        private readonly mapper: TierMapper,
    ) { }

    async findAll(): Promise<Tier[]> {
        const models = await this.tx.tier.findMany({
            orderBy: { priority: 'asc' },
        });
        return models.map(model => this.mapper.toDomain(model));
    }

    async findByCode(code: string): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { code },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findByPriority(priority: number): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { priority },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findById(id: bigint): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { id },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async create(tier: Tier): Promise<Tier> {
        const data = this.mapper.toPersistence(tier);
        const model = await this.tx.tier.create({ data });
        return this.mapper.toDomain(model);
    }

    async update(tier: Tier): Promise<Tier> {
        if (!tier.id) throw new Error('Tier ID is required for update');
        const data = this.mapper.toPersistence(tier);
        const model = await this.tx.tier.update({
            where: { id: tier.id },
            data,
        });
        return this.mapper.toDomain(model);
    }
}

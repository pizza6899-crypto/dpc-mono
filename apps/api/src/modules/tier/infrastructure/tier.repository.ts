import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { TierRepositoryPort } from '../ports/tier.repository.port';
import { TierMapper } from './tier.mapper';
import { Tier } from '../domain';
import { TierException } from '../domain/tier.exception';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';

@Injectable()
export class TierRepository implements TierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: TierMapper,
    ) { }

    async findAll(): Promise<Tier[]> {
        const models = await this.tx.tier.findMany({
            orderBy: { priority: 'asc' },
            include: { translations: true },
        });
        return models.map(model => this.mapper.toDomain(model));
    }

    async findByCode(code: string): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { code },
            include: { translations: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findByPriority(priority: number): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { priority },
            include: { translations: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findLowestPriority(): Promise<Tier | null> {
        const model = await this.tx.tier.findFirst({
            orderBy: { priority: 'asc' },
            include: { translations: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async findById(id: bigint): Promise<Tier | null> {
        const model = await this.tx.tier.findUnique({
            where: { id },
            include: { translations: true },
        });
        return model ? this.mapper.toDomain(model) : null;
    }

    async create(tier: Tier): Promise<Tier> {
        const data = this.mapper.toPersistence(tier);
        const model = await this.tx.tier.create({
            data,
        });
        return this.mapper.toDomain(model);
    }

    async update(tier: Tier): Promise<Tier> {
        if (!tier.id) throw new TierException('Tier ID is required for update');
        const data = this.mapper.toPersistence(tier);

        const model = await this.tx.tier.update({
            where: { id: tier.id },
            data,
            include: { translations: true },
        });
        return this.mapper.toDomain(model);
    }


    async saveTranslation(tierId: bigint, language: string, name: string): Promise<void> {
        const existing = await this.tx.tierTranslation.findFirst({
            where: {
                tierId,
                language: language as any,
            },
        });

        if (existing) {
            await this.tx.tierTranslation.update({
                where: { id: existing.id },
                data: { name },
            });
        } else {
            await this.tx.tierTranslation.create({
                data: {
                    tierId,
                    language: language as any,
                    name,
                },
            });
        }
    }
}

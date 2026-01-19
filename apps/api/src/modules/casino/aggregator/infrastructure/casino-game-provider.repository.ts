import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { CasinoGameProviderRepositoryPort, ListProvidersOptions } from '../ports/casino-game-provider.repository.port';
import { CasinoGameProviderMapper } from './casino-game-provider.mapper';
// Note: You might need to define a specific exception for Provider not found, or reuse a generic one.
// For now I'll assume we can use a generic DomainException or similar if needed, 
// but based on valid patterns, I should throw a specific exception in 'get'.
import { CasinoGameProvider, CasinoGameProviderNotFoundException } from '../domain';

@Injectable()
export class CasinoGameProviderRepository implements CasinoGameProviderRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CasinoGameProviderMapper,
    ) { }

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
        return this.mapper.toDomain(updated);
    }

    async findById(id: bigint): Promise<CasinoGameProvider | null> {
        const found = await this.tx.casinoGameProvider.findUnique({
            where: { id },
        });
        return found ? this.mapper.toDomain(found) : null;
    }

    async getById(id: bigint): Promise<CasinoGameProvider> {
        const provider = await this.findById(id);
        if (!provider) {
            throw new CasinoGameProviderNotFoundException(id);
        }
        return provider;
    }

    async findByCode(aggregatorId: bigint, code: string): Promise<CasinoGameProvider | null> {
        const found = await this.tx.casinoGameProvider.findUnique({
            where: {
                aggregatorId_code: {
                    aggregatorId,
                    code,
                },
            },
        });
        return found ? this.mapper.toDomain(found) : null;
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

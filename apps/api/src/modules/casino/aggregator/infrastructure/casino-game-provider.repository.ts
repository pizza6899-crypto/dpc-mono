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
    private readonly cacheById = new Map<bigint, { data: CasinoGameProvider, timestamp: number }>();
    private readonly cacheByCode = new Map<string, { data: CasinoGameProvider, timestamp: number }>();
    private readonly cacheByExternalId = new Map<string, { data: CasinoGameProvider, timestamp: number }>();
    private readonly CACHE_TTL = 60 * 1000; // 1분 캐시

    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
        private readonly mapper: CasinoGameProviderMapper,
    ) { }

    private getCacheKey(aggregatorId: bigint, code: string): string {
        return `${aggregatorId}:${code}`;
    }

    private updateCache(provider: CasinoGameProvider): void {
        const now = Date.now();
        if (provider.id) {
            this.cacheById.set(provider.id, { data: provider, timestamp: now });
        }
        this.cacheByCode.set(this.getCacheKey(provider.aggregatorId, provider.code), { data: provider, timestamp: now });
        this.cacheByExternalId.set(this.getCacheKey(provider.aggregatorId, provider.externalId), { data: provider, timestamp: now });
    }

    private clearCache(provider: CasinoGameProvider): void {
        if (provider.id) {
            this.cacheById.delete(provider.id);
        }
        this.cacheByCode.delete(this.getCacheKey(provider.aggregatorId, provider.code));
        this.cacheByExternalId.delete(this.getCacheKey(provider.aggregatorId, provider.externalId));
    }

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
        this.clearCache(domain);

        return domain;
    }

    async findById(id: bigint): Promise<CasinoGameProvider | null> {
        const cached = this.cacheById.get(id);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
            return cached.data;
        }

        const found = await this.tx.casinoGameProvider.findUnique({
            where: { id },
        });

        if (found) {
            const domain = this.mapper.toDomain(found);
            this.updateCache(domain);
            return domain;
        }
        return null;
    }

    async getById(id: bigint): Promise<CasinoGameProvider> {
        const provider = await this.findById(id);
        if (!provider) {
            throw new CasinoGameProviderNotFoundException(id);
        }
        return provider;
    }

    async findByCode(aggregatorId: bigint, code: string): Promise<CasinoGameProvider | null> {
        const key = this.getCacheKey(aggregatorId, code);
        const cached = this.cacheByCode.get(key);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
            return cached.data;
        }

        const found = await this.tx.casinoGameProvider.findUnique({
            where: {
                aggregatorId_code: {
                    aggregatorId,
                    code,
                },
            },
        });

        if (found) {
            const domain = this.mapper.toDomain(found);
            this.updateCache(domain);
            return domain;
        }
        return null;
    }

    async findByExternalId(aggregatorId: bigint, externalId: string): Promise<CasinoGameProvider | null> {
        const key = this.getCacheKey(aggregatorId, externalId);
        const cached = this.cacheByExternalId.get(key);
        const now = Date.now();

        if (cached && (now - cached.timestamp) < this.CACHE_TTL) {
            return cached.data;
        }

        const found = await this.tx.casinoGameProvider.findUnique({
            where: {
                aggregatorId_externalId: {
                    aggregatorId,
                    externalId,
                },
            },
        });

        if (found) {
            const domain = this.mapper.toDomain(found);
            this.updateCache(domain);
            return domain;
        }
        return null;
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

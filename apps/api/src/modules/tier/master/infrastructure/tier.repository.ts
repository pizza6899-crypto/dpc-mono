import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Tier } from '../domain/tier.entity';
import { TierRepositoryPort, UpdateTierProps } from './tier.repository.port';

@Injectable()
export class TierRepository implements TierRepositoryPort {
    private cachedTiers: Tier[] | null = null;
    private lastFetched: number = 0;
    private readonly CACHE_TTL = 60 * 1000; // 1분

    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findAll(): Promise<Tier[]> {
        const now = Date.now();
        if (this.cachedTiers && (now - this.lastFetched < this.CACHE_TTL)) {
            return this.cachedTiers;
        }

        const records = await this.tx.tier.findMany({
            include: { translations: true },
            orderBy: { priority: 'asc' }
        });

        const tiers = records.map(record => Tier.fromPersistence(record));
        this.cachedTiers = tiers;
        this.lastFetched = now;

        return tiers;
    }

    async findByPriority(priority: number): Promise<Tier | null> {
        const record = await this.tx.tier.findUnique({
            where: { priority },
            include: { translations: true }
        });
        return record ? Tier.fromPersistence(record) : null;
    }

    async findByCode(code: string): Promise<Tier | null> {
        const record = await this.tx.tier.findUnique({
            where: { code },
            include: { translations: true }
        });
        return record ? Tier.fromPersistence(record) : null;
    }

    async findNextTierByPriority(priority: number): Promise<Tier | null> {
        const record = await this.tx.tier.findFirst({
            where: { priority: { gt: priority } },
            orderBy: { priority: 'asc' },
            include: { translations: true }
        });
        return record ? Tier.fromPersistence(record) : null;
    }

    async update(props: UpdateTierProps): Promise<Tier> {
        const { code, translations, updatedBy, ...data } = props;

        // translations upsert를 위해 id를 먼저 조회 (tierId_language 복합키 대응)
        const current = await this.tx.tier.findUnique({
            where: { code },
            select: { id: true }
        });

        if (!current) {
            throw new Error(`Tier not found with code: ${code}`);
        }

        const tierId = current.id;

        const record = await this.tx.tier.update({
            where: { code },
            data: {
                ...data,
                updatedBy,
                translations: translations ? {
                    upsert: translations.map(t => ({
                        where: { tierId_language: { tierId: tierId, language: t.language } },
                        update: { name: t.name, description: t.description },
                        create: { language: t.language, name: t.name, description: t.description }
                    }))
                } : undefined
            },
            include: { translations: true }
        });

        const updated = Tier.fromPersistence(record);
        this.cachedTiers = null;
        this.lastFetched = 0;
        return updated;
    }
}

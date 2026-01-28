import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Tier } from '../domain/tier.entity';
import { TierRepositoryPort, UpdateTierProps } from './master.repository.port';

@Injectable()
export class TierRepository implements TierRepositoryPort {
    constructor(
        @InjectTransaction()
        private readonly tx: PrismaTransaction,
    ) { }

    async findAll(): Promise<Tier[]> {
        const records = await this.tx.tier.findMany({
            include: { translations: true },
            orderBy: { priority: 'asc' }
        });
        return records.map(record => Tier.fromPersistence(record));
    }

    async findById(id: bigint): Promise<Tier | null> {
        const record = await this.tx.tier.findUnique({
            where: { id },
            include: { translations: true }
        });
        return record ? Tier.fromPersistence(record) : null;
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

    async update(props: UpdateTierProps): Promise<Tier> {
        const { id, translations, updatedBy, ...data } = props;

        const record = await this.tx.tier.update({
            where: { id },
            data: {
                ...data,
                updatedBy,
                translations: translations ? {
                    upsert: translations.map(t => ({
                        where: { tierId_language: { tierId: id, language: t.language } },
                        update: { name: t.name, description: t.description },
                        create: { language: t.language, name: t.name, description: t.description }
                    }))
                } : undefined
            },
            include: { translations: true }
        });

        return Tier.fromPersistence(record);
    }
}

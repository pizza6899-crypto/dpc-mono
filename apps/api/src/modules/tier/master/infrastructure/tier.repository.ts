import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { Tier } from '../domain/tier.entity';
import { TierRepositoryPort } from './master.repository.port';

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
        return records.map(Tier.fromPersistence);
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
}

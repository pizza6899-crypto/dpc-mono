import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Tier } from '../domain/tier.entity';
import { TierConfig } from '../domain/tier-config.entity';
import { TierRepositoryPort, TierConfigRepositoryPort } from './master.repository.port';

@Injectable()
export class TierRepository implements TierRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<Tier[]> {
        const records = await this.prisma.tier.findMany({
            include: { translations: true },
            orderBy: { priority: 'asc' }
        });
        return records.map(Tier.fromPersistence);
    }

    async findById(id: bigint): Promise<Tier | null> {
        const record = await this.prisma.tier.findUnique({
            where: { id },
            include: { translations: true }
        });
        return record ? Tier.fromPersistence(record) : null;
    }
}

@Injectable()
export class TierConfigRepository implements TierConfigRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async find(): Promise<TierConfig | null> {
        const record = await this.prisma.tierConfig.findFirst({
            orderBy: { updatedAt: 'desc' }
        });
        return record ? TierConfig.fromPersistence(record) : null;
    }
}

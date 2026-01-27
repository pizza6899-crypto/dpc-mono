import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { Tier } from '../../domain/tier.entity';
import { TierRepositoryPort } from './tier.repository.port';

@Injectable()
export class TierRepository implements TierRepositoryPort {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<Tier[]> {
        const records = await this.prisma.tier.findMany({
            include: {
                translations: true,
            },
            orderBy: {
                priority: 'asc',
            },
        });
        return records.map(Tier.fromPersistence);
    }

    async findById(id: bigint): Promise<Tier | null> {
        const record = await this.prisma.tier.findUnique({
            where: { id },
            include: {
                translations: true,
            },
        });
        return record ? Tier.fromPersistence(record) : null;
    }

    async findByCode(code: string): Promise<Tier | null> {
        const record = await this.prisma.tier.findUnique({
            where: { code },
            include: {
                translations: true,
            },
        });
        return record ? Tier.fromPersistence(record) : null;
    }
}

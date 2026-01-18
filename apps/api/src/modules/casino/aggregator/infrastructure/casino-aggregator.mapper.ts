import { Injectable } from '@nestjs/common';
import { CasinoAggregator as PrismaCasinoAggregator, Prisma } from '@repo/database';
import { CasinoAggregator } from '../domain';

@Injectable()
export class CasinoAggregatorMapper {
    toDomain(prisma: PrismaCasinoAggregator): CasinoAggregator {
        return CasinoAggregator.create({
            id: prisma.id,
            name: prisma.name,
            code: prisma.code,
            status: prisma.status,
            createdAt: prisma.createdAt,
            updatedAt: prisma.updatedAt,
        });
    }

    toPrisma(domain: CasinoAggregator): Prisma.CasinoAggregatorCreateInput {
        return {
            name: domain.name,
            code: domain.code,
            status: domain.status,
        };
    }
}

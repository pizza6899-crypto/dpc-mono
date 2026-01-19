import { Injectable } from '@nestjs/common';
import { CasinoGameProvider as PrismaCasinoGameProvider, Prisma } from '@repo/database';
import { CasinoGameProvider } from '../domain';

@Injectable()
export class CasinoGameProviderMapper {
    toDomain(model: PrismaCasinoGameProvider): CasinoGameProvider {
        return CasinoGameProvider.create({
            id: model.id,
            aggregatorId: model.aggregatorId,
            externalId: model.externalId,
            name: model.name,
            code: model.code,
            groupCode: model.groupCode,
            imageUrl: model.imageUrl,
            isActive: model.isActive,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }

    toPrisma(domain: CasinoGameProvider): Prisma.CasinoGameProviderUncheckedCreateInput {
        return {
            aggregatorId: domain.aggregatorId,
            externalId: domain.externalId,
            name: domain.name,
            code: domain.code,
            groupCode: domain.groupCode,
            imageUrl: domain.imageUrl,
            isActive: domain.isActive,
        };
    }
}

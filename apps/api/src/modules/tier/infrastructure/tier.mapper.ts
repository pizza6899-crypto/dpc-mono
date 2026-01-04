import { Injectable } from '@nestjs/common';
import { Tier as TierModel, Prisma } from '@repo/database';
import { Tier } from '../domain';

@Injectable()
export class TierMapper {
    toDomain(model: TierModel): Tier {
        return Tier.fromPersistence({
            id: model.id,
            uid: model.uid,
            priority: model.priority,
            code: model.code,
            requirementUsd: model.requirementUsd,
            levelUpBonus: model.levelUpBonus,
            compRate: model.compRate,
            benefits: model.benefits,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            // displayName: model.displayName ?? undefined, // Not in DB yet
        });
    }

    toPersistence(domain: Tier): Prisma.TierUncheckedCreateInput {
        return {
            id: domain.id ?? undefined,
            uid: domain.uid,
            priority: domain.priority,
            code: domain.code,
            requirementUsd: domain.requirementUsd,
            levelUpBonus: domain.levelUpBonus,
            compRate: domain.compRate,
            benefits: domain.benefits ?? Prisma.JsonNull,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            // displayName: domain.displayName,
        };
    }
}

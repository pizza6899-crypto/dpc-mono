import { Injectable } from '@nestjs/common';
import { Tier as TierModel, Prisma } from '@repo/database';
import { generateUid } from 'src/utils/id.util';
import { Tier } from '../domain';

@Injectable()
export class TierMapper {
    toDomain(model: TierModel & { translations?: { language: string; name: string }[] }): Tier {
        return Tier.fromPersistence({
            id: model.id,
            uid: model.uid,
            priority: model.priority,
            code: model.code,
            requirementUsd: model.requirementUsd,
            levelUpBonusUsd: model.levelUpBonusUsd,
            compRate: model.compRate,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            translations: model.translations?.map(t => ({
                language: t.language,
                name: t.name,
            })),
        });
    }

    toPersistence(domain: Tier): Prisma.TierCreateInput {
        return {
            id: domain.id ?? undefined,
            uid: domain.uid,
            priority: domain.priority,
            code: domain.code,
            requirementUsd: domain.requirementUsd,
            levelUpBonusUsd: domain.levelUpBonusUsd,
            compRate: domain.compRate,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}

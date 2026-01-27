import { Injectable } from '@nestjs/common';
import { UserTier as UserTierModel, Tier as TierModel, Prisma } from '@prisma/client';
import { UserTier } from '../domain';
import { TierMapper } from './tier.mapper';

@Injectable()
export class UserTierMapper {
    constructor(private readonly tierMapper: TierMapper) { }

    toDomain(model: UserTierModel & { tier?: TierModel }): UserTier {
        return UserTier.fromPersistence({
            id: model.id,
            userId: model.userId,
            tierId: model.tierId,
            cumulativeRollingUsd: model.cumulativeRollingUsd,
            currentPeriodRollingUsd: model.currentPeriodRollingUsd,
            evaluationDate: model.evaluationDate,
            highestPromotedPriority: model.highestPromotedPriority,
            isManualLock: model.isManualLock,
            lastPromotedAt: model.lastPromotedAt,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
            tier: model.tier ? this.tierMapper.toDomain(model.tier) : undefined,
        });
    }

    toPersistence(domain: UserTier): Prisma.UserTierUncheckedCreateInput {
        return {
            id: domain.id ?? undefined,
            userId: domain.userId,
            tierId: domain.tierId,
            cumulativeRollingUsd: domain.cumulativeRollingUsd,
            currentPeriodRollingUsd: domain.currentPeriodRollingUsd,
            evaluationDate: domain.evaluationDate,
            highestPromotedPriority: domain.highestPromotedPriority,
            isManualLock: domain.isManualLock,
            lastPromotedAt: domain.lastPromotedAt,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}

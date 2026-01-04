import { Injectable } from '@nestjs/common';
import { UserTier as UserTierModel, Tier as TierModel, Prisma } from '@repo/database';
import { UserTier } from '../domain';
import { TierMapper } from './tier.mapper';

@Injectable()
export class UserTierMapper {
    constructor(private readonly tierMapper: TierMapper) { }

    toDomain(model: UserTierModel & { tier?: TierModel }): UserTier {
        return UserTier.fromPersistence({
            id: model.id,
            uid: model.uid,
            userId: model.userId,
            tierId: model.tierId,
            cumulativeRollingUsd: model.cumulativeRollingUsd,
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
            uid: domain.uid,
            userId: domain.userId,
            tierId: domain.tierId, // Changed from _tierId (getter accessor used)
            cumulativeRollingUsd: domain.cumulativeRollingUsd,
            highestPromotedPriority: domain.highestPromotedPriority,
            isManualLock: domain.isManualLock,
            lastPromotedAt: domain.lastPromotedAt,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }
}

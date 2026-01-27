import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UserTier } from '../domain/user-tier.entity';
import {
    USER_TIER_REPOSITORY,
    type UserTierRepositoryPort,
} from '../infrastructure/user-tier.repository.port';
import {
    TIER_REPOSITORY,
    type TierRepositoryPort,
} from '../infrastructure/tier.repository.port';
import { Prisma } from '@prisma/client';
import { UserTierStatus } from '@prisma/client';

@Injectable()
export class GetUserTierService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
        @Inject(TIER_REPOSITORY)
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTier> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (userTier) return userTier;

        // If user tier not found, we should probably assign default (BRONZE)
        // For now, let's try to find the default tier (Level 1)
        // In a real scenario, this logic might be inside a dedicated "AssignDefaultTierService"
        // but putting it here ensures safe fallback.

        // Find lowest priority tier
        const tiers = await this.tierRepository.findAll();
        if (tiers.length === 0) {
            throw new NotFoundException('No tiers defined in the system');
        }

        // Assuming tiers are sorted by priority asc
        const defaultTier = tiers[0];

        // Create default user tier in memory (not persisted unless action taken)
        // Or persist it? Persistence is safer.
        // Let's persist it to initialize.

        const newUserTier = new UserTier(
            0n, // Placeholder ID
            userId,
            defaultTier.id,
            new Prisma.Decimal(0),
            new Prisma.Decimal(0),
            new Date(),
            defaultTier.priority,
            UserTierStatus.ACTIVE,
            null,
            new Date(),
            null, null, null, null, null, null, null, null, true, // Configs
            defaultTier
        );

        return this.userTierRepository.save(newUserTier);
    }
}

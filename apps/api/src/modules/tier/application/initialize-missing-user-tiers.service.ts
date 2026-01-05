import { Inject, Injectable, Logger } from '@nestjs/common';
import { USER_TIER_REPOSITORY } from '../ports/repository.token';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { AssignDefaultTierService } from './assign-default-tier.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class InitializeMissingUserTiersService {
    private readonly logger = new Logger(InitializeMissingUserTiersService.name);

    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly assignDefaultTierService: AssignDefaultTierService,
    ) { }

    @Transactional()
    async execute(): Promise<{ processedCount: number }> {
        // 1. Find all user IDs without a tier
        const userIds = await this.userTierRepository.findUserIdsWithoutTier();

        this.logger.log(`Found ${userIds.length} users without a tier mapping.`);

        let processedCount = 0;

        // 2. For each user, assign the default tier
        // Note: AssignDefaultTierService its own @Transactional and lock handling
        for (const userId of userIds) {
            try {
                await this.assignDefaultTierService.execute(userId);
                processedCount++;
            } catch (error) {
                this.logger.error(`Failed to initialize tier for user ${userId}:`, error);
            }
        }

        return { processedCount };
    }
}

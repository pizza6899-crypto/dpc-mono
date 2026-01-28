import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierEvaluationCycle, Prisma } from '@prisma/client';

@Injectable()
export class ResetUserTierPerformanceService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new NotFoundException('User tier info not found');
        }

        // Cycle days calculation could be moved to shared util but simple explicit mapping here is fine
        let cycleDays = 30;
        switch (userTier.tier.evaluationCycle) {
            case TierEvaluationCycle.ROLLING_30_DAYS: cycleDays = 30; break;
            case TierEvaluationCycle.ROLLING_90_DAYS: cycleDays = 90; break;
            case TierEvaluationCycle.NONE: cycleDays = 9999; break;
        }

        userTier.resetPeriodPerformance(cycleDays);
        await this.userTierRepository.save(userTier);
    }
}

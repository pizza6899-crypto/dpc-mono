import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { DemotionPolicy } from '../domain/demotion.policy';
import { DemotionService } from './demotion.service';
import { TierEvaluationCycle } from '@prisma/client';

@Injectable()
export class TierEvaluationService {
    private readonly logger = new Logger(TierEvaluationService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly demotionPolicy: DemotionPolicy,
        private readonly demotionService: DemotionService,
    ) { }

    @Transactional()
    async evaluateUser(userId: bigint, allTiers: any[]): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) return;

        const result = this.demotionPolicy.evaluate(userTier, allTiers);

        switch (result.action) {
            case 'MAINTAIN':
                const maintainDays = this.getCycleDays(userTier.tier!.evaluationCycle);
                userTier.resetPeriodPerformance(maintainDays);
                await this.userTierRepository.save(userTier);
                break;
            case 'GRACE':
                const targetTier = allTiers.find(t => t.priority < userTier.tier!.priority) ?? userTier.tier;
                if (targetTier) {
                    userTier.setDemotionWarning(targetTier.id, result.graceEndsAt!);
                }
                await this.userTierRepository.save(userTier);
                break;
            case 'DEMOTE':
                const demotedDays = this.getCycleDays(result.targetTier!.evaluationCycle);

                await this.demotionService.execute(
                    userId,
                    result.targetTier!,
                    demotedDays,
                    'Failed to meet maintenance requirements after grace period'
                );
                break;
        }
    }

    private getCycleDays(cycle: TierEvaluationCycle): number {
        switch (cycle) {
            case TierEvaluationCycle.ROLLING_30_DAYS: return 30;
            case TierEvaluationCycle.ROLLING_90_DAYS: return 90;
            case TierEvaluationCycle.NONE: return 9999; // 사실상 무제한
            default: return 30;
        }
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { DemotionPolicy } from '../domain/demotion.policy';
import { DemotionService } from './demotion.service';
import { Tier } from '../../master/domain/tier.entity';
import { TierEvaluationCycle } from '@prisma/client';
import { TierConfigRepositoryPort } from '../../master/infrastructure/tier-config.repository.port';

@Injectable()
export class TierEvaluationService {
    private readonly logger = new Logger(TierEvaluationService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierConfigRepository: TierConfigRepositoryPort,
        private readonly demotionPolicy: DemotionPolicy,
        private readonly demotionService: DemotionService,
    ) { }

    @Transactional()
    async evaluateUser(userId: bigint, allTiers: Tier[]): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) return;

        // 1. 글로벌 강등 설정 확인
        const config = await this.tierConfigRepository.find();
        const isDowngradeDisabled = config?.isDowngradeEnabled === false;
        const gracePeriodDays = config?.defaultGracePeriodDays ?? 7;

        let result = this.demotionPolicy.evaluate(userTier, allTiers, gracePeriodDays);

        // 강등이 비활성화된 경우, 어떤 결과가 나오더라도 MAINTAIN으로 강제 전환
        if (isDowngradeDisabled && result.action !== 'MAINTAIN') {
            this.logger.debug(`Downgrade is disabled globally (isDowngradeEnabled=false). Overriding evaluation result for user ${userId} to MAINTAIN.`);
            result = { action: 'MAINTAIN' };
        }

        switch (result.action) {
            case 'MAINTAIN':
                const maintainDays = this.getCycleDays(userTier.tier!.evaluationCycle);
                userTier.resetPeriodPerformance(maintainDays);
                await this.userTierRepository.save(userTier);
                break;
            case 'GRACE':
                if (result.targetTier) {
                    userTier.setDemotionWarning(result.targetTier.id, result.graceEndsAt!);
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

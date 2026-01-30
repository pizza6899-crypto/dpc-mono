import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { DemotionPolicy } from '../domain/demotion.policy';
import { DemotionService } from './demotion.service';
import { TierChangeType, UserTierStatus, TierEvaluationCycle } from '@prisma/client';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class BatchEvaluationService {
    private readonly logger = new Logger(BatchEvaluationService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly tierAuditService: TierAuditService,
        private readonly demotionPolicy: DemotionPolicy,
        private readonly demotionService: DemotionService,
    ) { }

    /**
     * 정기 심사를 수행합니다 (강등 및 유지 확인).
     */
    async evaluateAll(): Promise<void> {
        const log = await this.tierAuditService.startEvaluationLog();
        const metrics = {
            totalProcessedCount: 0,
            promotedCount: 0,
            demotedCount: 0,
            gracePeriodCount: 0,
            maintainedCount: 0,
            skippedBonusCount: 0,
        };

        try {
            const allTiers = await this.tierRepository.findAll();
            const now = nowUtc();

            // 1. 심사 대상 유저 조회 (과부하 방지를 위해 배치 크기 제한)
            const targets = await this.userTierRepository.findUsersNeedingEvaluation(now, 100);

            for (const userTier of targets) {
                try {
                    await this.evaluateUser(userTier.userId, allTiers, metrics);
                    metrics.totalProcessedCount++;
                } catch (err) {
                    this.logger.error(`User evaluation failed for ${userTier.userId}: ${err.message}`);
                }
            }

            await this.tierAuditService.finishEvaluationLog(log.id, log.startedAt, metrics);
        } catch (error) {
            this.logger.error(`Batch evaluation failed: ${error.message}`);
            await this.tierAuditService.finishEvaluationLog(log.id, log.startedAt, metrics, error.message);
            throw error;
        }
    }

    @Transactional()
    async evaluateUser(userId: bigint, allTiers: any[], metrics: any): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) return;

        const result = this.demotionPolicy.evaluate(userTier, allTiers);

        switch (result.action) {
            case 'MAINTAIN':
                metrics.maintainedCount++;
                const maintainDays = this.getCycleDays(userTier.tier!.evaluationCycle);
                userTier.resetPeriodPerformance(maintainDays);
                await this.userTierRepository.save(userTier);
                break;
            case 'GRACE':
                metrics.gracePeriodCount++;
                const targetTier = allTiers.find(t => t.priority < userTier.tier!.priority) ?? userTier.tier;
                if (targetTier) {
                    userTier.setDemotionWarning(targetTier.id, result.graceEndsAt!);
                }
                await this.userTierRepository.save(userTier);
                break;
            case 'DEMOTE':
                metrics.demotedCount++;
                const demotedDays = this.getCycleDays(result.targetTier!.evaluationCycle);

                // Delegate to DemotionService
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

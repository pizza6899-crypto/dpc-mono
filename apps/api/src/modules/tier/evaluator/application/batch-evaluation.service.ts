import { Injectable, Logger } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { DemotionPolicy } from '../domain/demotion.policy';
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

            // 1. 심사 대상 유저 조회
            const targets = await this.userTierRepository.findUsersNeedingEvaluation(now);

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
                userTier.status = UserTierStatus.GRACE;
                userTier.graceEndsAt = result.graceEndsAt!;
                await this.userTierRepository.save(userTier);

                // 경고 기록
                await this.tierAuditService.recordDemotionWarning(userId, {
                    currentTierId: userTier.tierId,
                    targetTierId: allTiers.find(t => t.priority < userTier.tier!.priority)?.id ?? userTier.tierId,
                    evaluationDueAt: result.graceEndsAt!,
                    requiredRolling: userTier.tier.maintenanceRollingUsd,
                    currentRolling: userTier.currentPeriodRollingUsd,
                });
                break;
            case 'DEMOTE':
                metrics.demotedCount++;
                const oldTierId = userTier.tierId;
                const demotedDays = this.getCycleDays(result.targetTier!.evaluationCycle);
                userTier.updateTier(result.targetTier!.id, result.targetTier!.priority);
                userTier.resetPeriodPerformance(demotedDays);
                await this.userTierRepository.save(userTier);

                await this.tierAuditService.recordTierChange({
                    userId,
                    fromTierId: oldTierId,
                    toTierId: result.targetTier!.id,
                    changeType: TierChangeType.DOWNGRADE,
                    reason: 'Failed to meet maintenance requirements after grace period',
                    rollingAmountSnap: userTier.currentPeriodRollingUsd,
                    depositAmountSnap: userTier.currentPeriodDepositUsd,
                    compRateSnap: userTier.customCompRate ?? result.targetTier!.compRate,
                    lossbackRateSnap: userTier.customLossbackRate ?? result.targetTier!.lossbackRate,
                    rakebackRateSnap: userTier.customRakebackRate ?? result.targetTier!.rakebackRate,
                    requirementUsdSnap: result.targetTier!.requirementUsd,
                    requirementDepositUsdSnap: result.targetTier!.requirementDepositUsd,
                    cumulativeDepositUsdSnap: userTier.currentPeriodDepositUsd,
                });
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

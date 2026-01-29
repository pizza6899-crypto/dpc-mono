import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { Tier } from '../../master/domain/tier.entity';
import { TierChangeType } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class DemotionService {
    private readonly logger = new Logger(DemotionService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierAuditService: TierAuditService,
    ) { }

    @Transactional()
    async execute(userId: bigint, targetTier: Tier, cycleDays: number, reason: string): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) throw new Error(`UserTier not initialized for user ${userId}`);

        const currentTier = userTier.tier;

        // 1. 상태 업데이트 (티어 변경 및 실적 리셋)
        userTier.updateTier(targetTier.id, targetTier.priority);
        userTier.resetPeriodPerformance(cycleDays);

        await this.userTierRepository.save(userTier);

        // 2. 강등 이력 기록
        await this.tierAuditService.recordTierChange({
            userId,
            fromTierId: currentTier.id,
            toTierId: targetTier.id,
            changeType: TierChangeType.DOWNGRADE,
            reason,
            rollingAmountSnap: userTier.currentPeriodRollingUsd,
            depositAmountSnap: userTier.currentPeriodDepositUsd,
            compRateSnap: userTier.customCompRate ?? targetTier.compRate,
            lossbackRateSnap: userTier.customLossbackRate ?? targetTier.lossbackRate,
            rakebackRateSnap: userTier.customRakebackRate ?? targetTier.rakebackRate,
            requirementUsdSnap: targetTier.requirementUsd,
            requirementDepositUsdSnap: targetTier.requirementDepositUsd,
            cumulativeDepositUsdSnap: userTier.currentPeriodDepositUsd,
        });

        this.logger.log(`User ${userId} demoted to ${targetTier.code} (from ${currentTier.code})`);
    }
}

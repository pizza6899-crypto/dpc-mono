import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
import { UserTier } from '../domain/user-tier.entity';
import { Prisma, UserTierStatus, TierEvaluationCycle, TierChangeType } from '@prisma/client';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class InitializeUserTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly tierAuditService: TierAuditService,
    ) { }

    @Transactional()
    async execute(userId: bigint): Promise<UserTier> {
        const existing = await this.userTierRepository.findByUserId(userId);
        if (existing) return existing;

        const allTiers = await this.tierRepository.findAll();
        // Since findAll is ordered by priority ASC in the repository, [0] is the base tier.
        const baseTier = allTiers[0];
        if (!baseTier) throw new Error('Tier definitions missing');

        // Calculate next evaluation date based on the tier's cycle
        const nextEvaluationAt = this.calculateNextEvaluationAt(baseTier.evaluationCycle);

        const newUserTier = new UserTier(
            0n,
            userId,
            baseTier.id,
            // States
            new Prisma.Decimal(0), // totalEffectiveRollingUsd
            new Prisma.Decimal(0), // currentPeriodRollingUsd
            new Prisma.Decimal(0), // currentPeriodDepositUsd
            new Date(),            // lastEvaluationAt
            // Controls
            baseTier.priority,     // highestPromotedPriority
            null,                  // lastBonusReceivedAt
            UserTierStatus.ACTIVE, // status
            null,                  // graceEndsAt
            new Date(),            // lastTierChangedAt
            // Overrides (Default null)
            null, null, null, null, null, null, null, null,
            // Audit & Joined Data
            true,                  // isBonusEligible
            nextEvaluationAt,      // nextEvaluationAt
            null,                  // note
            // Warning
            null,                  // demotionWarningIssuedAt
            null,                  // demotionWarningTargetTierId
            baseTier               // Joined Tier data
        );

        const savedUserTier = await this.userTierRepository.save(newUserTier);

        // Record Initial Tier History
        await this.tierAuditService.recordTierChange({
            userId,
            fromTierId: null,
            toTierId: baseTier.id,
            changeType: TierChangeType.INITIAL,
            reason: 'User initialized with base tier',
            rollingAmountSnap: new Prisma.Decimal(0),
            depositAmountSnap: new Prisma.Decimal(0),
            compRateSnap: baseTier.compRate,
            lossbackRateSnap: baseTier.lossbackRate,
            rakebackRateSnap: baseTier.rakebackRate,
            requirementUsdSnap: baseTier.requirementUsd,
            requirementDepositUsdSnap: baseTier.requirementDepositUsd,
            cumulativeDepositUsdSnap: new Prisma.Decimal(0),
            changeBy: 'SYSTEM',
        });

        return savedUserTier;
    }

    private calculateNextEvaluationAt(cycle: TierEvaluationCycle): Date | null {
        const now = new Date();
        switch (cycle) {
            case TierEvaluationCycle.ROLLING_30_DAYS:
                now.setUTCDate(now.getUTCDate() + 30);
                return now;
            case TierEvaluationCycle.ROLLING_90_DAYS:
                now.setUTCDate(now.getUTCDate() + 90);
                return now;
            case TierEvaluationCycle.NONE:
                return null;
            default:
                // Default to 30 days if unknown
                now.setUTCDate(now.getUTCDate() + 30);
                return now;
        }
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { Tier } from '../../master/domain/tier.entity';
import { Prisma, TierChangeType } from '@prisma/client';

@Injectable()
export class PromotionService {
    private readonly logger = new Logger(PromotionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierAuditService: TierAuditService,
    ) { }

    async execute(userId: bigint, targetTier: Tier, reason: string = 'Automatic promotion'): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) throw new Error(`UserTier not initialized for user ${userId}`);

        const currentTier = userTier.tier;

        await this.prisma.$transaction(async (tx) => {
            // 1. 유저 상태 업데이트
            await tx.userTier.update({
                where: { userId },
                data: {
                    tierId: targetTier.id,
                    highestPromotedPriority: Math.max(userTier.highestPromotedPriority, targetTier.priority),
                    lastTierChangedAt: new Date(),
                    status: 'ACTIVE',
                    graceEndsAt: null,
                }
            });

            // 2. 히스토리 스냅샷 기록 (AuditService 사용)
            await this.tierAuditService.recordTierChange({
                userId,
                fromTierId: currentTier.id,
                toTierId: targetTier.id,
                changeType: TierChangeType.UPGRADE,
                reason,
                rollingAmountSnap: userTier.totalEffectiveRollingUsd,
                compRateSnap: userTier.customCompRate ?? targetTier.compRate,
                lossbackRateSnap: userTier.customLossbackRate ?? targetTier.lossbackRate,
                rakebackRateSnap: userTier.customRakebackRate ?? targetTier.rakebackRate,
                requirementUsdSnap: targetTier.requirementUsd,
                requirementDepositUsdSnap: targetTier.requirementDepositUsd,
                cumulativeDepositUsdSnap: new Prisma.Decimal(0),
            });
        });

        this.logger.log(`User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`);
    }
}

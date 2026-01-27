import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository';
import { TierHistoryRepositoryPort } from '../../audit/infrastructure/tier-history.repository';
import { Tier } from '../../master/domain/tier.entity';
import { TierChangeType } from '@prisma/client';

@Injectable()
export class PromotionService {
    private readonly logger = new Logger(PromotionService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierHistoryRepository: TierHistoryRepositoryPort,
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

            // 2. 히스토리 스냅샷 기록
            await this.tierHistoryRepository.save({
                userId,
                fromTierId: currentTier.id,
                toTierId: targetTier.id,
                changeType: TierChangeType.UPGRADE,
                reason,
                rollingAmountSnap: userTier.totalEffectiveRollingUsd.toNumber(),
                compRateSnap: userTier.customCompRate?.toNumber() ?? targetTier.compRate.toNumber(),
                lossbackRateSnap: userTier.customLossbackRate?.toNumber() ?? targetTier.lossbackRate.toNumber(),
                rakebackRateSnap: userTier.customRakebackRate?.toNumber() ?? targetTier.rakebackRate.toNumber(),
                requirementUsdSnap: targetTier.requirementUsd.toNumber(),
                requirementDepositUsdSnap: targetTier.requirementDepositUsd.toNumber(),
                cumulativeDepositUsdSnap: 0, // 입금 모듈 연동 필요 시 보완
            });
        });

        this.logger.log(`User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`);
    }
}

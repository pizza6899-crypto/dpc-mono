import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { Tier } from '../../master/domain/tier.entity';
import { Prisma, TierChangeType } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { nowUtc } from 'src/utils/date.util';

@Injectable()
export class PromotionService {
    private readonly logger = new Logger(PromotionService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierAuditService: TierAuditService,
    ) { }

    @Transactional()
    async execute(userId: bigint, targetTier: Tier, reason: string = 'Automatic promotion'): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) throw new Error(`UserTier not initialized for user ${userId}`);

        const currentTier = userTier.tier;

        // 1. 유저 상태 업데이트 (Entity 메서드 사용 권장되나 현재는 단순 필드 업데이트)
        userTier.updateTier(targetTier.id, targetTier.priority);

        await this.userTierRepository.save(userTier);

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
            cumulativeDepositUsdSnap: new Prisma.Decimal(0), // Profile 엔티티에 필드 추가 필요할 수 있음
        });

        this.logger.log(`User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`);
    }
}

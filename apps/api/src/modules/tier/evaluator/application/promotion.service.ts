import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierAuditService } from '../../audit/application/tier-audit.service';
import { Tier } from '../../master/domain/tier.entity';
import { TierChangeType, Prisma } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { TierConfigRepositoryPort } from '../../master/infrastructure/tier-config.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';

@Injectable()
export class PromotionService {
    private readonly logger = new Logger(PromotionService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly tierAuditService: TierAuditService,
        private readonly tierConfigRepository: TierConfigRepositoryPort,
    ) { }

    @Transactional()
    async execute(userId: bigint, targetTier: Tier, reason: string = 'Automatic promotion'): Promise<void> {
        // 0. 글로벌 승급 설정 확인
        const config = await this.tierConfigRepository.find();
        if (config?.isPromotionEnabled === false) {
            this.logger.debug(`Promotion is disabled globally. Skipping promotion for user ${userId}.`);
            return;
        }

        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) throw new Error(`UserTier not initialized for user ${userId}`);

        const currentTier = userTier.tier;

        // 1. 유저 상태 업데이트
        const previousHighestPriority = userTier.highestPromotedPriority;
        const shouldAwardBonus = userTier.updateTier(targetTier.id, targetTier.priority);

        await this.userTierRepository.save(userTier);

        if (shouldAwardBonus) {
            // 건너뛴 모든 티어의 보너스를 합산하여 지급 (유저 역차별 방지)
            const allTiers = await this.tierRepository.findAll();
            const eligibleTiers = allTiers.filter(t =>
                t.priority > previousHighestPriority &&
                t.priority <= targetTier.priority
            );

            const totalBonus = eligibleTiers.reduce(
                (sum, t) => sum.add(t.levelUpBonusUsd),
                new Prisma.Decimal(0)
            );

            if (totalBonus.gt(0)) {
                // TODO: 승급 보너스 지급 로직 통합 (Wallet/Bonus Module)
                if (eligibleTiers.length > 1) {
                    this.logger.log(`User ${userId} promoted multiple tiers at once. Total bonus sum: ${totalBonus} USD (Tiers: ${eligibleTiers.map(t => t.code).join(', ')})`);
                } else {
                    this.logger.log(`User ${userId} is eligible for level-up bonus: ${totalBonus} USD`);
                }
            }
        }

        // 2. 히스토리 스냅샷 기록 (AuditService 사용)
        await this.tierAuditService.recordTierChange({
            userId,
            fromTierId: currentTier.id,
            toTierId: targetTier.id,
            changeType: TierChangeType.UPGRADE,
            reason,
            rollingAmountSnap: userTier.currentPeriodRollingUsd,
            depositAmountSnap: userTier.currentPeriodDepositUsd,
            compRateSnap: userTier.customCompRate ?? targetTier.compRate,
            lossbackRateSnap: userTier.customLossbackRate ?? targetTier.lossbackRate,
            rakebackRateSnap: userTier.customRakebackRate ?? targetTier.rakebackRate,
            requirementUsdSnap: targetTier.requirementUsd,
            requirementDepositUsdSnap: targetTier.requirementDepositUsd,
            cumulativeDepositUsdSnap: userTier.currentPeriodDepositUsd, // 임시로 현재 주기 입금액 사용 (추후 필요시 total 필드 추가)
        });

        this.logger.log(`User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`);
    }
}

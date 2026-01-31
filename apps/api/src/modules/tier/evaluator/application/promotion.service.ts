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

        // 1. 유저 상태 업데이트 및 보너스 산정
        const previousHighestPriority = userTier.highestPromotedPriority;
        const isEligibleForPromotionBonus = userTier.updateTier(targetTier.id, targetTier.priority);

        let earnedBonusAmount = new Prisma.Decimal(0);
        let skippedReason: string | undefined;
        let bonusClaimedAt: Date | null = null;

        if (isEligibleForPromotionBonus) {
            // [Logic] 지급 가능 여부와 관계없이, 이번 승급으로 인해 발생한 보너스 원천 금액을 먼저 계산합니다.
            const allTiers = await this.tierRepository.findAll();
            const eligibleTiers = allTiers.filter(t =>
                t.priority > previousHighestPriority &&
                t.priority <= targetTier.priority
            );

            earnedBonusAmount = eligibleTiers.reduce(
                (sum, t) => sum.add(t.levelUpBonusUsd),
                new Prisma.Decimal(0)
            );

            // [Logic] 보너스 금액이 존재할 때만 지급 정책을 확인합니다.
            if (earnedBonusAmount.gt(0)) {
                if (config?.isBonusEnabled !== false) {
                    if (targetTier.isImmediateBonusEnabled) {
                        // [Action] 즉시 지급 대상 티어인 경우 (Wallet 모듈 연동 지점)
                        this.logger.log(`[Promotion:Auto-Payout] User ${userId} received ${earnedBonusAmount} USD bonus.`);
                        bonusClaimedAt = new Date();
                    } else {
                        // [Action] 클레임 대상 티어인 경우 (유저가 직접 버튼을 눌러야 함)
                        this.logger.log(`[Promotion:Claim-Wait] User ${userId} earned ${earnedBonusAmount} USD bonus. Waiting for claim.`);
                    }
                } else {
                    // [Policy] 시스템 설정에 의해 지급이 중단된 경우
                    skippedReason = 'GLOBAL_BONUS_DISABLED';
                    this.logger.debug(`Bonus is disabled globally. Skipping payout for user ${userId}, but recorded as skipped.`);
                }
            }
        }

        await this.userTierRepository.save(userTier);

        // 2. 히스토리 스냅샷 기록 (Audit 및 클레임 증빙용)
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
            cumulativeDepositUsdSnap: userTier.totalDepositUsd,
            bonusAmount: earnedBonusAmount.gt(0) && !skippedReason ? earnedBonusAmount : null,
            bonusClaimedAt: bonusClaimedAt,
            skippedBonusAmount: skippedReason ? earnedBonusAmount : null,
            skippedReason: skippedReason,
        });

        // 3. 실시간 통계 갱신 (승급 카운트 증분)
        await this.tierAuditService.incrementTierStats(new Date(), targetTier.id, {
            promotedCount: 1,
            totalBonusPaidUsd: bonusClaimedAt ? earnedBonusAmount : undefined,
        });

        this.logger.log(`User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`);
    }
}

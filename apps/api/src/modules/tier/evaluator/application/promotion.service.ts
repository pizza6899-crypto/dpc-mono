import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { TierStatsService } from '../../audit/application/tier-stats.service';
import { Tier } from '../../master/domain/tier.entity';
import { TierChangeType, Prisma } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { TierConfigRepositoryPort } from '../../master/infrastructure/tier-config.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';
import { UserTierNotFoundException } from '../../profile/domain/tier-profile.exception';

@Injectable()
export class PromotionService {
    private readonly logger = new Logger(PromotionService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly recordTierHistoryService: RecordTierHistoryService,
        private readonly tierStatsService: TierStatsService,
        private readonly tierConfigRepository: TierConfigRepositoryPort,
    ) { }

    @Transactional()
    async execute(userId: bigint, targetTier: Tier, reason: string = 'Automatic promotion'): Promise<void> {
        // 0. 글로벌 승급 설정 확인
        const config = await this.tierConfigRepository.find();
        if (config?.isUpgradeEnabled === false) {
            this.logger.debug(`Promotion is disabled globally. Skipping promotion for user ${userId}.`);
            return;
        }

        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new UserTierNotFoundException();
        }

        const currentTier = userTier.tier;

        // 1. 유저 상태 업데이트 및 보너스 산정
        const previousHighestLevel = userTier.maxLevelAchieved;
        const isEligibleForPromotionBonus = userTier.upgradeTier(targetTier.id, targetTier.level);

        let earnedBonusAmount = new Prisma.Decimal(0);
        let skippedReason: string | undefined;
        let bonusClaimedAt: Date | null = null;

        if (isEligibleForPromotionBonus) {
            // [Logic] 지급 가능 여부와 관계없이, 이번 승급으로 인해 발생한 보너스 원천 금액을 먼저 계산합니다.
            const allTiers = await this.tierRepository.findAll();
            const eligibleTiers = allTiers.filter(t =>
                t.level > previousHighestLevel &&
                t.level <= targetTier.level
            );

            earnedBonusAmount = eligibleTiers.reduce(
                (sum, t) => sum.add(t.upgradeBonusUsd),
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
        await this.recordTierHistoryService.execute({
            userId,
            fromTierId: currentTier.id,
            toTierId: targetTier.id,
            changeType: TierChangeType.UPGRADE,
            reason,
            statusRollingUsdSnap: userTier.statusRollingUsd,
            currentPeriodDepositUsdSnap: userTier.currentPeriodDepositUsd,
            compRateSnap: userTier.customCompRate ?? targetTier.compRate,
            weeklyLossbackRateSnap: userTier.customWeeklyLossbackRate ?? targetTier.weeklyLossbackRate,
            monthlyLossbackRateSnap: userTier.customMonthlyLossbackRate ?? targetTier.monthlyLossbackRate,
            upgradeRollingRequiredUsdSnap: targetTier.upgradeRollingRequiredUsd,
            upgradeDepositRequiredUsdSnap: targetTier.upgradeDepositRequiredUsd,
            lifetimeRollingUsdSnap: userTier.lifetimeRollingUsd,
            lifetimeDepositUsdSnap: userTier.lifetimeDepositUsd,
            hasBonusGenerated: earnedBonusAmount.gt(0) && !skippedReason,
            bonusAmountUsdSnap: earnedBonusAmount,
            skippedReason: skippedReason,
        });

        // 3. 실시간 통계 갱신 (승급 카운트 증분)
        await this.tierStatsService.increment(new Date(), targetTier.id, {
            upgradedCount: 1,
            periodBonusPaidUsd: bonusClaimedAt ? earnedBonusAmount : undefined,
        });

        this.logger.log(`User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`);
    }
}

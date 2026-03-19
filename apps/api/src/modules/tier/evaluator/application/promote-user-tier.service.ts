import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { TierStatsService } from '../../audit/application/tier-stats.service';
import { Tier } from '../../config/domain/tier.entity';
import { TierChangeType, Prisma } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { TierConfigRepositoryPort } from '../../config/infrastructure/tier-config.repository.port';
import { TierRepositoryPort } from '../../config/infrastructure/tier.repository.port';
import { UserTierNotFoundException } from '../../profile/domain/tier-profile.exception';
import { GrantRewardService } from 'src/modules/reward/core/application/grant-reward.service';
import { ClaimRewardService as CoreClaimRewardService } from 'src/modules/reward/core/application/claim-reward.service';
import {
  RewardSourceType,
  RewardItemType,
  WageringTargetType,
} from '@prisma/client';

@Injectable()
export class PromoteUserTierService {
  private readonly logger = new Logger(PromoteUserTierService.name);

  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly tierRepository: TierRepositoryPort,
    private readonly recordTierHistoryService: RecordTierHistoryService,
    private readonly tierStatsService: TierStatsService,
    private readonly tierConfigRepository: TierConfigRepositoryPort,
    private readonly grantRewardService: GrantRewardService,
    private readonly claimRewardService: CoreClaimRewardService,
  ) {}

  @Transactional()
  async execute(
    userId: bigint,
    targetTier: Tier,
    reason: string = 'Automatic promotion',
  ): Promise<void> {
    // 0. 글로벌 승급 설정 확인
    const config = await this.tierConfigRepository.find();
    if (config?.isUpgradeEnabled === false) {
      this.logger.debug(
        `Promotion is disabled globally. Skipping promotion for user ${userId}.`,
      );
      return;
    }

    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException();
    }

    const currentTier = userTier.tier;

    // 1. 유저 상태 업데이트 및 보너스 산정
    const previousHighestLevel = userTier.maxLevelAchieved;
    const isEligibleForPromotionBonus = userTier.upgradeTier(
      targetTier.id,
      targetTier.level,
    );

    let earnedBonusAmount = new Prisma.Decimal(0);
    let skippedReason: string | undefined;
    let bonusClaimedAt: Date | null = null;

    if (isEligibleForPromotionBonus) {
      // [Logic] 지급 가능 여부와 관계없이, 이번 승급으로 인해 발생한 보너스 원천 금액을 먼저 계산합니다.
      const allTiers = await this.tierRepository.findAll();
      const eligibleTiers = allTiers.filter(
        (t) => t.level > previousHighestLevel && t.level <= targetTier.level,
      );

      const rewardCurrency = userTier.preferredRewardCurrency || 'USD';
      earnedBonusAmount = eligibleTiers.reduce((sum, t) => {
        const benefit = t.getBenefitByCurrency(rewardCurrency);
        return sum.add(benefit?.upgradeBonus ?? 0);
      }, new Prisma.Decimal(0));

      // [Logic] 보너스 금액이 존재할 때만 지급 정책을 확인합니다.
      if (earnedBonusAmount.gt(0)) {
        if (config?.isBonusEnabled !== false) {
          // 0. 보상 만료일 계산 (티어별 설정 우선, 없으면 글로벌 설정 적용. 둘 다 없으면 무기한)
          const expiryDays =
            targetTier.rewardExpiryDays ?? config?.defaultRewardExpiryDays;
          let expiresAt: Date | undefined;

          if (expiryDays && expiryDays > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);
          }

          // 1. 코어 리워드 모듈을 이용한 보상 발급 (PENDING 상태로 시작)
          const reward = await this.grantRewardService.execute({
            userId,
            sourceType: RewardSourceType.TIER_REWARD,
            sourceId: targetTier.id,
            rewardType: RewardItemType.BONUS_MONEY,
            currency: rewardCurrency,
            amount: earnedBonusAmount,
            wageringTargetType: WageringTargetType.AMOUNT,
            wageringMultiplier: targetTier.upgradeBonusWageringMultiplier,
            expiresAt,
            metadata: undefined,
          });

          // [Policy] 승급 보너스는 기본적으로 PENDING 상태로 지급하며, 유저가 직접 클레임하도록 유도합니다.
          // (자동 지급 로직이 필요한 경우 여기서 claimRewardService.execute를 추가로 호출할 수 있습니다.)
          this.logger.log(
            `[Promotion:Reward-Granted] User ${userId} earned ${earnedBonusAmount} ${rewardCurrency} bonus. RewardId: ${reward.id}`,
          );
        } else {
          // [Policy] 시스템 설정에 의해 지급이 중단된 경우
          skippedReason = 'GLOBAL_BONUS_DISABLED';
          this.logger.debug(
            `Bonus is disabled globally. Skipping payout for user ${userId}, but recorded as skipped.`,
          );
        }
      }
    }

    await this.userTierRepository.save(userTier);

    // 2. 히스토리 스냅샷 기록 (Audit 및 클레임 증빙용)
    const benefits = userTier.getEffectiveBenefits(targetTier);
    await this.recordTierHistoryService.execute({
      userId,
      fromTierId: currentTier.id,
      toTierId: targetTier.id,
      changeType: TierChangeType.UPGRADE,
      reason,

      // Benefit Snapshot
      compRateSnap: benefits.compRate,
      weeklyLossbackRateSnap: benefits.weeklyLossbackRate,
      monthlyLossbackRateSnap: benefits.monthlyLossbackRate,
      upgradeBonusWageringMultiplierSnap:
        targetTier.upgradeBonusWageringMultiplier,

      // Limit & Flag Snapshot
      dailyWithdrawalLimitUsdSnap: benefits.dailyWithdrawalLimitUsd,
      weeklyWithdrawalLimitUsdSnap: benefits.weeklyWithdrawalLimitUsd,
      monthlyWithdrawalLimitUsdSnap: benefits.monthlyWithdrawalLimitUsd,
      isWithdrawalUnlimitedSnap: benefits.isWithdrawalUnlimited,
      hasDedicatedManagerSnap: benefits.hasDedicatedManager,

      // Custom Override Status
      isCustomBenefitAppliedSnap: !!(
        userTier.customCompRate ||
        userTier.customWeeklyLossbackRate ||
        userTier.customMonthlyLossbackRate ||
        userTier.customDailyWithdrawalLimitUsd ||
        userTier.customWeeklyWithdrawalLimitUsd ||
        userTier.customMonthlyWithdrawalLimitUsd ||
        userTier.isCustomWithdrawalUnlimited !== null ||
        userTier.isCustomDedicatedManager !== null
      ),

      // Reward Audit
      hasBonusGenerated: earnedBonusAmount.gt(0) && !skippedReason,
      currency: userTier.preferredRewardCurrency || 'USD',
      upgradeBonusSnap: earnedBonusAmount,
      skippedReason: skippedReason,

      // XP Snapshot
      statusExpSnap: userTier.statusExp,
    });

    // 3. 실시간 통계 갱신 (승급 카운트 증분)
    await this.tierStatsService.increment(new Date(), targetTier.id, {
      upgradedCount: 1,
      periodRewardClaimedUsd: bonusClaimedAt ? earnedBonusAmount : undefined,
    });

    this.logger.log(
      `User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`,
    );
  }
}

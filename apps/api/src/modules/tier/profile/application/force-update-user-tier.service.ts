import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { TierStatsService } from '../../audit/application/tier-stats.service';
import { TierRepositoryPort } from '../../config/infrastructure/tier.repository.port';
import { TierConfigRepositoryPort } from '../../config/infrastructure/tier-config.repository.port';
import { TierChangeType, Prisma, RewardSourceType, RewardItemType, WageringTargetType } from '@prisma/client';
import { UserTierNotFoundException } from '../domain/tier-profile.exception';
import { TierNotFoundException } from '../../config/domain/tier-config.exception';
import { Transactional } from '@nestjs-cls/transactional';
import { GrantRewardService } from 'src/modules/reward/core/application/grant-reward.service';
import { ClaimRewardService as CoreClaimRewardService } from 'src/modules/reward/core/application/claim-reward.service';
import { AdvisoryLockService, LockNamespace } from 'src/common/concurrency';

@Injectable()
export class ForceUpdateUserTierService {
  private readonly logger = new Logger(ForceUpdateUserTierService.name);

  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly tierRepository: TierRepositoryPort,
    private readonly tierConfigRepository: TierConfigRepositoryPort,
    private readonly recordTierHistoryService: RecordTierHistoryService,
    private readonly tierStatsService: TierStatsService,
    private readonly grantRewardService: GrantRewardService,
    private readonly claimRewardService: CoreClaimRewardService,
    private readonly advisoryLockService: AdvisoryLockService,
  ) { }

  @Transactional()
  async execute(
    userId: bigint,
    targetTierId: bigint,
    reason: string,
    isGrantBonus: boolean = false,
  ): Promise<void> {
    await this.advisoryLockService.acquireLock(
      LockNamespace.USER_TIER,
      userId.toString(),
    );

    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException();
    }

    const allTiers = await this.tierRepository.findAll();
    const targetTier = allTiers.find((t) => t.id === targetTierId);
    if (!targetTier) {
      throw new TierNotFoundException();
    }

    const oldTierId = userTier.tierId;
    const previousHighestLevel = userTier.maxLevelAchieved;

    // 티어 이동 (레벨 증가분에 대해 지급 여부 판단)
    const isEligibleForPromotionBonus = userTier.upgradeTier(targetTierId, targetTier.level);

    let earnedBonusAmount = new Prisma.Decimal(0);
    let skippedReason: string | undefined;
    let bonusClaimedAt: Date | null = null;

    // 강제 승급이면서 보너스 부여 옵션이 선택된 경우 && 이전 최고등급보다 높아 보너스 수령 자격이 있는 경우
    if (isGrantBonus && isEligibleForPromotionBonus) {
      const eligibleTiers = allTiers.filter(
        (t) => t.level > previousHighestLevel && t.level <= targetTier.level,
      );

      earnedBonusAmount = eligibleTiers.reduce(
        (sum, t) => sum.add(t.upgradeBonusUsd),
        new Prisma.Decimal(0),
      );

      if (earnedBonusAmount.gt(0)) {
        const config = await this.tierConfigRepository.find();

        if (config?.isBonusEnabled !== false) {
          const expiryDays = targetTier.rewardExpiryDays ?? config?.defaultRewardExpiryDays;
          let expiresAt: Date | undefined;

          if (expiryDays && expiryDays > 0) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiryDays);
          }

          const reward = await this.grantRewardService.execute({
            userId,
            sourceType: RewardSourceType.TIER_REWARD,
            sourceId: targetTier.id,
            rewardType: RewardItemType.BONUS_MONEY,
            currency: userTier.preferredRewardCurrency || 'USD',
            amount: earnedBonusAmount,
            wageringTargetType: WageringTargetType.AMOUNT,
            wageringMultiplier: targetTier.upgradeBonusWageringMultiplier,
            expiresAt,
            metadata: undefined,
          });

          if (targetTier.isImmediateBonusEnabled) {
            if (userTier.preferredRewardCurrency) {
              await this.claimRewardService.execute({
                userId,
                rewardId: reward.id,
              });
              this.logger.log(`[ForceUpdate:Auto-Payout] User ${userId} received ${earnedBonusAmount} USD bonus.`);
              bonusClaimedAt = new Date();
            } else {
              this.logger.log(`[ForceUpdate:Auto-Wait] User ${userId} has no preferred currency. Waiting for manual claim.`);
            }
          } else {
            this.logger.log(`[ForceUpdate:Claim-Wait] User ${userId} earned ${earnedBonusAmount} USD bonus. Waiting for manual claim.`);
          }
        } else {
          skippedReason = 'GLOBAL_BONUS_DISABLED';
          this.logger.debug(`Bonus disabled globally. Skipping payout for ForceUpdate of user ${userId}.`);
        }
      }
    }

    await this.userTierRepository.save(userTier);

    await this.recordTierHistoryService.execute({
      userId,
      fromTierId: oldTierId,
      toTierId: targetTierId,
      changeType: TierChangeType.MANUAL_UPDATE,
      reason: `Admin Force Update: ${reason}`,
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
      skippedReason,
    });

    // 만약 보너스가 발급되었다면 통계 갱신
    if (isGrantBonus && isEligibleForPromotionBonus && targetTier.level > previousHighestLevel) {
      await this.tierStatsService.increment(new Date(), targetTier.id, {
        upgradedCount: 1,
        periodBonusPaidUsd: bonusClaimedAt ? earnedBonusAmount : undefined,
      });
    }

    this.logger.log(`User ${userId} force updated to tier ${targetTier.code} with isGrantBonus=${isGrantBonus}`);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { TierStatsService } from '../../audit/application/tier-stats.service';
import { Tier } from '../../definitions/domain/tier.entity';
import { TierChangeType, Prisma } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { TierConfigRepositoryPort } from '../../definitions/infrastructure/tier-config.repository.port';
import { TierRepositoryPort } from '../../definitions/infrastructure/tier.repository.port';
import { UserTierNotFoundException } from '../../profile/domain/tier-profile.exception';
import { GrantRewardService } from 'src/modules/reward/core/application/grant-reward.service';
import { ClaimRewardService as CoreClaimRewardService } from 'src/modules/reward/core/application/claim-reward.service';
import { RewardSourceType, RewardItemType, WageringTargetType } from '@prisma/client';

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
  ) { }

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

      earnedBonusAmount = eligibleTiers.reduce(
        (sum, t) => sum.add(t.upgradeBonusUsd),
        new Prisma.Decimal(0),
      );

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
            rewardType: RewardItemType.BONUS_MONEY, // 즉시 출금 가능한 캐시나 보너스로 사용 가능하도록 기본 부여
            currency: userTier.preferredRewardCurrency || 'USD', // 티어에서는 보상 발급 시점에 기준 통화를 USD등으로 시작하나, 향후 환산 될 수 있음
            amount: earnedBonusAmount,
            wageringTargetType: WageringTargetType.AMOUNT,
            wageringMultiplier: targetTier.upgradeBonusWageringMultiplier,
            expiresAt,
            metadata: undefined, // 별도의 번역키나 프리스핀 없이 지급되므로 명시적 undefined 처리
          });

          if (targetTier.isImmediateBonusEnabled) {
            // [Action] 즉시 지급 대상 티어인 경우
            if (userTier.preferredRewardCurrency) {
              // 유저가 선호 통화를 등록한 경우에만 자동 지급 처리 (코어 모듈 클레임 호출)
              await this.claimRewardService.execute({
                userId,
                rewardId: reward.id,
              });
              this.logger.log(
                `[Promotion:Auto-Payout] User ${userId} received ${earnedBonusAmount} USD bonus in ${userTier.preferredRewardCurrency}.`,
              );
              bonusClaimedAt = new Date();
            } else {
              // 선호 통화가 없는 경우 즉시 지급 대상이라도 클레임 대기로 전환 (유저가 통화를 선택하며 클레임하도록 유도)
              this.logger.log(
                `[Promotion:Auto-Wait] User ${userId} eligible for immediate payout but has no preferred currency. Waiting for manual claim.`,
              );
            }
          } else {
            // [Action] 클레임 대상 티어인 경우 (유저가 직접 버튼을 눌러야 함)
            this.logger.log(
              `[Promotion:Claim-Wait] User ${userId} earned ${earnedBonusAmount} USD bonus. Waiting for manual claim.`,
            );
          }
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
    await this.recordTierHistoryService.execute({
      userId,
      fromTierId: currentTier.id,
      toTierId: targetTier.id,
      changeType: TierChangeType.UPGRADE,
      reason,
      statusRollingUsdSnap: userTier.statusRollingUsd,
      currentPeriodDepositUsdSnap: userTier.currentPeriodDepositUsd,
      compRateSnap: userTier.customCompRate ?? targetTier.compRate,
      weeklyLossbackRateSnap:
        userTier.customWeeklyLossbackRate ?? targetTier.weeklyLossbackRate,
      monthlyLossbackRateSnap:
        userTier.customMonthlyLossbackRate ?? targetTier.monthlyLossbackRate,
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

    this.logger.log(
      `User ${userId} promoted to ${targetTier.code} (from ${currentTier.code})`,
    );
  }
}

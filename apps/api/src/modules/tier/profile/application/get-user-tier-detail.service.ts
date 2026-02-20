import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierStatus } from '@prisma/client';
import { UserTierNotFoundException } from '../domain/tier-profile.exception';

export interface UserTierDetailResult {
  id: string;
  userId: string;
  tierId: string;
  tierName: string;
  tierCode: string;
  level: number;
  lifetimeRollingUsd: string;
  statusRollingUsd: string;
  currentPeriodRollingUsd: string;
  lifetimeDepositUsd: string;
  currentPeriodDepositUsd: string;
  lastEvaluationAt: Date;
  maxLevelAchieved: number;
  lastBonusReceivedAt: Date | null;
  status: UserTierStatus;
  downgradeGracePeriodEndsAt: Date | null;
  lastTierChangedAt: Date;
  customCompRate: string | null;
  customWeeklyLossbackRate: string | null;
  customMonthlyLossbackRate: string | null;
  customWithdrawalLimitUsd: string | null;
  isCustomWithdrawalUnlimited: boolean | null;
  isCustomDedicatedManager: boolean | null;
  isBonusEligible: boolean;
  nextEvaluationAt: Date | null;
  note: string | null;
  downgradeWarningIssuedAt: Date | null;
  downgradeWarningTargetTierId: string | null;
  downgradeWarningTargetTierName: string | null;
  currentBenefits: {
    compRate: string;
    weeklyLossbackRate: string;
    monthlyLossbackRate: string;
    dailyWithdrawalLimitUsd: string;
    isWithdrawalUnlimited: boolean;
    hasDedicatedManager: boolean;
  };
}

@Injectable()
export class GetUserTierDetailService {
  constructor(private readonly userTierRepository: UserTierRepositoryPort) {}

  async execute(userId: bigint): Promise<UserTierDetailResult> {
    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException();
    }

    const benefits = userTier.getEffectiveBenefits();

    return {
      id: userTier.id.toString(),
      userId: userTier.userId.toString(),
      tierId: userTier.tierId.toString(),
      tierName: userTier.tier.getName(),
      tierCode: userTier.tier.code,
      level: userTier.currentLevel,
      lifetimeRollingUsd: userTier.lifetimeRollingUsd.toString(),
      statusRollingUsd: userTier.statusRollingUsd.toString(),
      currentPeriodRollingUsd: userTier.currentPeriodRollingUsd.toString(),
      lifetimeDepositUsd: userTier.lifetimeDepositUsd.toString(),
      currentPeriodDepositUsd: userTier.currentPeriodDepositUsd.toString(),
      lastEvaluationAt: userTier.lastEvaluationAt,
      maxLevelAchieved: userTier.maxLevelAchieved,
      lastBonusReceivedAt: userTier.lastBonusReceivedAt,
      status: userTier.status,
      downgradeGracePeriodEndsAt: userTier.downgradeGracePeriodEndsAt,
      lastTierChangedAt: userTier.lastTierChangedAt,
      customCompRate: userTier.customCompRate?.toString() ?? null,
      customWeeklyLossbackRate:
        userTier.customWeeklyLossbackRate?.toString() ?? null,
      customMonthlyLossbackRate:
        userTier.customMonthlyLossbackRate?.toString() ?? null,
      customWithdrawalLimitUsd:
        userTier.customWithdrawalLimitUsd?.toString() ?? null,
      isCustomWithdrawalUnlimited: userTier.isCustomWithdrawalUnlimited,
      isCustomDedicatedManager: userTier.isCustomDedicatedManager,
      isBonusEligible: userTier.isBonusEligible,
      nextEvaluationAt: userTier.nextEvaluationAt,
      note: userTier.note,
      downgradeWarningIssuedAt: userTier.downgradeWarningIssuedAt,
      downgradeWarningTargetTierId:
        userTier.downgradeWarningTargetTierId?.toString() ?? null,
      downgradeWarningTargetTierName:
        userTier.downgradeWarningTargetTier?.getName() ?? null,
      currentBenefits: {
        compRate: benefits.compRate.toString(),
        weeklyLossbackRate: benefits.weeklyLossbackRate.toString(),
        monthlyLossbackRate: benefits.monthlyLossbackRate.toString(),
        dailyWithdrawalLimitUsd: benefits.dailyWithdrawalLimitUsd.toString(),
        isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
        hasDedicatedManager: benefits.hasDedicatedManager,
      },
    };
  }
}

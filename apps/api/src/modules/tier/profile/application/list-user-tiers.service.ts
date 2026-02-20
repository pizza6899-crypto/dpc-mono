import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierStatus } from '@prisma/client';
import { PaginatedData } from 'src/common/http/types/pagination.types';

export interface ListUserTiersParams {
  tierId?: bigint;
  status?: UserTierStatus;
  userId?: bigint;
  email?: string;
  search?: string;
  page: number;
  limit: number;
}

export interface UserTierListItemResult {
  id: string;
  userId: string;
  tierId: string;
  tierName: string;
  tierCode: string;
  level: number;
  lifetimeRollingUsd: string;
  currentPeriodRollingUsd: string;
  currentPeriodDepositUsd: string;
  status: UserTierStatus;
  lastTierChangedAt: Date;
  nextEvaluationAt: Date | null;
  maxLevelAchieved: number;
  downgradeGracePeriodEndsAt: Date | null;
  isBonusEligible: boolean;
  hasCustomOverrides: boolean;
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
export class ListUserTiersService {
  constructor(private readonly userTierRepository: UserTierRepositoryPort) {}

  async execute(
    params: ListUserTiersParams,
  ): Promise<PaginatedData<UserTierListItemResult>> {
    const { items, total } = await this.userTierRepository.findMany(params);

    return {
      data: items.map((ut) => {
        const benefits = ut.getEffectiveBenefits();
        return {
          id: ut.id.toString(),
          userId: ut.userId.toString(),
          tierId: ut.tierId.toString(),
          tierName: ut.tier?.getName() ?? 'Unknown',
          tierCode: ut.tier?.code ?? 'UNKNOWN',
          level: ut.currentLevel,
          lifetimeRollingUsd: ut.lifetimeRollingUsd.toString(),
          currentPeriodRollingUsd: ut.currentPeriodRollingUsd.toString(),
          currentPeriodDepositUsd: ut.currentPeriodDepositUsd.toString(),
          status: ut.status,
          lastTierChangedAt: ut.lastTierChangedAt,
          nextEvaluationAt: ut.nextEvaluationAt,
          maxLevelAchieved: ut.maxLevelAchieved,
          downgradeGracePeriodEndsAt: ut.downgradeGracePeriodEndsAt,
          isBonusEligible: ut.isBonusEligible,
          hasCustomOverrides: !!(
            ut.customCompRate ||
            ut.customWeeklyLossbackRate ||
            ut.customMonthlyLossbackRate ||
            ut.customWithdrawalLimitUsd ||
            ut.isCustomWithdrawalUnlimited !== null ||
            ut.isCustomDedicatedManager !== null
          ),
          currentBenefits: {
            compRate: benefits.compRate.toString(),
            weeklyLossbackRate: benefits.weeklyLossbackRate.toString(),
            monthlyLossbackRate: benefits.monthlyLossbackRate.toString(),
            dailyWithdrawalLimitUsd:
              benefits.dailyWithdrawalLimitUsd.toString(),
            isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
            hasDedicatedManager: benefits.hasDedicatedManager,
          },
        };
      }),
      total,
      page: params.page,
      limit: params.limit,
    };
  }
}

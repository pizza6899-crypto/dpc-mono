import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierStatus, Prisma, Language } from '@prisma/client';
import { UserTier } from '../domain/user-tier.entity';
import { UserTierNotFoundException } from '../domain/tier-profile.exception';

export interface MyTierResult {
  userTierId: bigint;
  tierId: bigint;
  code: string;
  name: string;
  level: number;
  imageUrl: string | null;
  status: UserTierStatus;
  lastTierChangedAt: Date;
  nextEvaluationAt: Date | null;
  benefits: {
    compRate: Prisma.Decimal;
    weeklyLossbackRate: Prisma.Decimal;
    monthlyLossbackRate: Prisma.Decimal;
    dailyWithdrawalLimitUsd: Prisma.Decimal;
    isWithdrawalUnlimited: boolean;
    hasDedicatedManager: boolean;
  };
}

@Injectable()
export class GetMyTierService {
  constructor(private readonly userTierRepository: UserTierRepositoryPort) {}

  /**
   * 유저 아이디로 유저 티어 엔티티를 조회합니다. (Join 포함)
   */
  async findUserTier(userId: bigint): Promise<UserTier> {
    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException();
    }
    return userTier;
  }

  /**
   * 유저 티어 엔티티를 포맷팅된 결과로 변환합니다.
   */
  execute(userTier: UserTier, language: Language = Language.EN): MyTierResult {
    const currentTier = userTier.tier!;
    const benefits = userTier.getEffectiveBenefits();

    return {
      userTierId: userTier.id,
      tierId: currentTier.id,
      code: currentTier.code,
      name: currentTier.getName(language),
      level: currentTier.level,
      imageUrl: currentTier.imageUrl,
      status: userTier.status,
      lastTierChangedAt: userTier.lastTierChangedAt,
      nextEvaluationAt: userTier.nextEvaluationAt,
      benefits: {
        compRate: benefits.compRate,
        weeklyLossbackRate: benefits.weeklyLossbackRate,
        monthlyLossbackRate: benefits.monthlyLossbackRate,
        dailyWithdrawalLimitUsd: benefits.dailyWithdrawalLimitUsd,
        isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
        hasDedicatedManager: benefits.hasDedicatedManager,
      },
    };
  }
}

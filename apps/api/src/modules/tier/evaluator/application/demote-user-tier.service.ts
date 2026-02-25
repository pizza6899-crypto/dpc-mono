import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { TierStatsService } from '../../audit/application/tier-stats.service';
import { Tier } from '../../config/domain/tier.entity';
import { TierChangeType, Prisma } from '@prisma/client';
import { Transactional } from '@nestjs-cls/transactional';
import { UserTierNotFoundException } from '../../profile/domain/tier-profile.exception';

@Injectable()
export class DemoteUserTierService {
  private readonly logger = new Logger(DemoteUserTierService.name);

  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly recordTierHistoryService: RecordTierHistoryService,
    private readonly tierStatsService: TierStatsService,
  ) {}

  @Transactional()
  async execute(
    userId: bigint,
    targetTier: Tier,
    cycleDays: number,
    reason: string,
  ): Promise<void> {
    const userTier = await this.userTierRepository.findByUserId(userId);
    if (!userTier || !userTier.tier) {
      throw new UserTierNotFoundException();
    }

    const currentTier = userTier.tier;

    // 1. 상태 업데이트 (강등 전용 메서드 호출 및 실적 리셋)
    userTier.downgradeTier(targetTier);
    userTier.resetPeriodPerformance(cycleDays);

    await this.userTierRepository.save(userTier);

    // 2. 강등 이력 기록
    await this.recordTierHistoryService.execute({
      userId,
      fromTierId: currentTier.id,
      toTierId: targetTier.id,
      changeType: TierChangeType.DOWNGRADE,
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
      hasBonusGenerated: false,
      bonusAmountUsdSnap: new Prisma.Decimal(0),
    });

    // 3. 실시간 통계 갱신 (강등 카운트 증분)
    await this.tierStatsService.increment(new Date(), targetTier.id, {
      downgradedCount: 1,
    });

    this.logger.log(
      `User ${userId} demoted to ${targetTier.code} (from ${currentTier.code})`,
    );
  }
}

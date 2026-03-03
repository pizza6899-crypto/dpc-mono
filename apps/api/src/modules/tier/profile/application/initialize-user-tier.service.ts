import { Injectable } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../config/infrastructure/tier.repository.port';
import { UserTier } from '../domain/user-tier.entity';
import {
  Prisma,
  UserTierStatus,
  TierEvaluationCycle,
  TierChangeType,
} from '@prisma/client';
import { RecordTierHistoryService } from '../../audit/application/record-tier-history.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class InitializeUserTierService {
  constructor(
    private readonly userTierRepository: UserTierRepositoryPort,
    private readonly tierRepository: TierRepositoryPort,
    private readonly recordTierHistoryService: RecordTierHistoryService,
  ) { }

  @Transactional()
  async execute(userId: bigint): Promise<UserTier> {
    const existing = await this.userTierRepository.findByUserId(userId);
    if (existing) return existing;

    const allTiers = await this.tierRepository.findAll();
    // [0]이 최하위 기초 티어
    const baseTier = allTiers[0];
    if (!baseTier) throw new Error('Tier definitions missing');

    const nextEvaluationAt = this.calculateNextEvaluationAt(
      baseTier.evaluationCycle,
    );

    const newUserTier = new UserTier(
      0n,
      userId,
      baseTier.id,
      // XP 상태 데이터
      0n, // statusExp
      0n, // lifetimeExp
      new Date(), // lastEvaluationAt
      // 승급/강등 제어
      baseTier.level,
      baseTier.level,
      null,
      UserTierStatus.ACTIVE,
      null,
      new Date(),
      null,
      null,
      // Overrides
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      // Audit & Misc
      null,
      true,
      nextEvaluationAt,
      null,
      null,
      null,
      baseTier,
    );

    const savedUserTier = await this.userTierRepository.save(newUserTier);

    // 초기 티어 할당 이력 기록
    await this.recordTierHistoryService.execute({
      userId,
      fromTierId: null,
      toTierId: baseTier.id,
      changeType: TierChangeType.INITIAL,
      reason: 'User initialized with base tier',

      // Benefit Snapshot
      compRateSnap: baseTier.compRate,
      weeklyLossbackRateSnap: baseTier.weeklyLossbackRate,
      monthlyLossbackRateSnap: baseTier.monthlyLossbackRate,
      upgradeBonusWageringMultiplierSnap:
        baseTier.upgradeBonusWageringMultiplier,

      // Limit & Flag Snapshot
      dailyWithdrawalLimitUsdSnap: baseTier.dailyWithdrawalLimitUsd,
      weeklyWithdrawalLimitUsdSnap: baseTier.weeklyWithdrawalLimitUsd,
      monthlyWithdrawalLimitUsdSnap: baseTier.monthlyWithdrawalLimitUsd,
      isWithdrawalUnlimitedSnap: baseTier.isWithdrawalUnlimited,
      hasDedicatedManagerSnap: baseTier.hasDedicatedManager,

      // Custom Override Status
      isCustomBenefitAppliedSnap: false,

      // Reward Audit
      hasBonusGenerated: false,
      currency: 'USD',
      upgradeBonusSnap: new Prisma.Decimal(0),

      // XP Snapshot
      statusExpSnap: 0n,
    });

    return savedUserTier;
  }

  private calculateNextEvaluationAt(cycle: TierEvaluationCycle): Date | null {
    const now = new Date();
    switch (cycle) {
      case TierEvaluationCycle.ROLLING_30_DAYS:
        now.setUTCDate(now.getUTCDate() + 30);
        return now;
      case TierEvaluationCycle.ROLLING_90_DAYS:
        now.setUTCDate(now.getUTCDate() + 90);
        return now;
      case TierEvaluationCycle.NONE:
        return null;
      default:
        now.setUTCDate(now.getUTCDate() + 30);
        return now;
    }
  }
}

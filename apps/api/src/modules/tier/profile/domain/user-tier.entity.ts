import type { ExchangeCurrencyCode } from '@prisma/client';
import { Prisma, UserTierStatus } from '@prisma/client';
import { Tier } from '../../config/domain/tier.entity';

export interface EffectiveBenefits {
  compRate: Prisma.Decimal;
  weeklyLossbackRate: Prisma.Decimal;
  monthlyLossbackRate: Prisma.Decimal;
  dailyWithdrawalLimitUsd: Prisma.Decimal;
  weeklyWithdrawalLimitUsd: Prisma.Decimal;
  monthlyWithdrawalLimitUsd: Prisma.Decimal;
  isWithdrawalUnlimited: boolean;
  hasDedicatedManager: boolean;
}

export class UserTier {
  constructor(
    public readonly id: bigint,
    public readonly userId: bigint,
    public tierId: bigint,

    // XP 상태 데이터
    public statusExp: bigint,
    public lifetimeExp: bigint,
    public lastEvaluationAt: Date,

    // 승급/강등 제어
    public currentLevel: number,
    public maxLevelAchieved: number,
    public lastBonusReceivedAt: Date | null,
    public status: UserTierStatus,
    public downgradeGracePeriodEndsAt: Date | null,
    public lastTierChangedAt: Date,
    public lastUpgradeAt: Date | null,
    public lastDowngradeAt: Date | null,

    // Overrides
    public customCompRate: Prisma.Decimal | null,
    public customWeeklyLossbackRate: Prisma.Decimal | null,
    public customMonthlyLossbackRate: Prisma.Decimal | null,
    public customDailyWithdrawalLimitUsd: Prisma.Decimal | null,
    public customWeeklyWithdrawalLimitUsd: Prisma.Decimal | null,
    public customMonthlyWithdrawalLimitUsd: Prisma.Decimal | null,
    public isCustomWithdrawalUnlimited: boolean | null,
    public isCustomDedicatedManager: boolean | null,

    // Audit & Misc
    public note: string | null,
    public isBonusEligible: boolean,
    public nextEvaluationAt: Date | null,
    public preferredRewardCurrency: ExchangeCurrencyCode | null,

    // Warning State
    public downgradeWarningIssuedAt: Date | null,
    public downgradeWarningTargetTierId: bigint | null,

    // Joined Data
    public readonly tier?: Tier,
    public readonly downgradeWarningTargetTier?: Tier,
  ) { }

  getEffectiveBenefits(baseTier?: Tier): EffectiveBenefits {
    const tier = baseTier || this.tier;
    if (!tier) throw new Error('Base tier is required for benefit calculation');

    return {
      compRate: this.customCompRate ?? tier.compRate,
      weeklyLossbackRate:
        this.customWeeklyLossbackRate ?? tier.weeklyLossbackRate,
      monthlyLossbackRate:
        this.customMonthlyLossbackRate ?? tier.monthlyLossbackRate,
      dailyWithdrawalLimitUsd:
        this.customDailyWithdrawalLimitUsd ?? tier.dailyWithdrawalLimitUsd,
      weeklyWithdrawalLimitUsd:
        this.customWeeklyWithdrawalLimitUsd ?? tier.weeklyWithdrawalLimitUsd,
      monthlyWithdrawalLimitUsd:
        this.customMonthlyWithdrawalLimitUsd ?? tier.monthlyWithdrawalLimitUsd,
      isWithdrawalUnlimited:
        this.isCustomWithdrawalUnlimited ?? tier.isWithdrawalUnlimited,
      hasDedicatedManager:
        this.isCustomDedicatedManager ?? tier.hasDedicatedManager,
    };
  }

  /**
   * 티어를 변경하고 상태를 초기화합니다 (승급 시).
   * @returns 승급 보너스 지급 대상 여부
   */
  upgradeTier(targetTierId: bigint, level: number): boolean {
    // 이전에 도달했던 최고 레벨보다 높은 레벨로 승급할 때만 보너스 지급
    const isBonusEligibleJump = level > this.maxLevelAchieved;

    this.tierId = targetTierId;
    this.currentLevel = level;
    this.maxLevelAchieved = Math.max(this.maxLevelAchieved, level);
    this.lastTierChangedAt = new Date();
    this.lastUpgradeAt = new Date();
    this.status = UserTierStatus.ACTIVE;
    this.downgradeGracePeriodEndsAt = null;
    this.downgradeWarningIssuedAt = null;
    this.downgradeWarningTargetTierId = null;

    return isBonusEligibleJump && this.isBonusEligible;
  }

  /**
   * 티어를 강등하고 상태를 초기화합니다.
   */
  downgradeTier(targetTier: Tier): void {
    this.tierId = targetTier.id;
    this.currentLevel = targetTier.level;
    this.lastTierChangedAt = new Date();
    this.lastDowngradeAt = new Date();
    this.status = UserTierStatus.ACTIVE;
    this.downgradeGracePeriodEndsAt = null;
    this.downgradeWarningIssuedAt = null;
    this.downgradeWarningTargetTierId = null;

    // [Policy] 강등 시 승급용 XP(statusExp)를 새 티어의 요구치로 Cap 처리합니다.
    if (this.statusExp > targetTier.upgradeExpRequired) {
      this.statusExp = targetTier.upgradeExpRequired;
    }
  }

  setDowngradeWarning(targetTierId: bigint, graceEndsAt: Date): void {
    this.status = UserTierStatus.GRACE;
    this.downgradeGracePeriodEndsAt = graceEndsAt;
    this.downgradeWarningIssuedAt = new Date();
    this.downgradeWarningTargetTierId = targetTierId;
  }

  /**
   * XP를 누적합니다.
   */
  incrementExp(amount: bigint): void {
    this.statusExp += amount;
    this.lifetimeExp += amount;
  }

  /**
   * 주기적 심사 완료 후 상태를 ACTIVE로 복구합니다. (등급 유지 시 호출)
   */
  resetPeriodPerformance(evaluationCycleDays: number): void {
    this.lastEvaluationAt = new Date();

    // 상태 복구 및 경고 초기화
    // [Policy] LOCKED 상태인 경우 관리자에 의해 강제 고정된 것이므로 ACTIVE로 복구하지 않음
    if (this.status !== UserTierStatus.LOCKED) {
      this.status = UserTierStatus.ACTIVE;
    }

    this.downgradeGracePeriodEndsAt = null;
    this.downgradeWarningIssuedAt = null;
    this.downgradeWarningTargetTierId = null;

    if (evaluationCycleDays > 0) {
      const nextDate = new Date();
      nextDate.setUTCDate(nextDate.getUTCDate() + evaluationCycleDays);
      this.nextEvaluationAt = nextDate;
    } else {
      this.nextEvaluationAt = null;
    }
  }

  static fromPersistence(
    data: Prisma.UserTierGetPayload<{
      include: {
        tier: { include: { translations: true } };
        downgradeWarningTargetTier: { include: { translations: true } };
      };
    }>,
  ): UserTier {
    const tier = data.tier ? Tier.fromPersistence(data.tier as any) : undefined;
    const downgradeWarningTargetTier = data.downgradeWarningTargetTier
      ? Tier.fromPersistence(data.downgradeWarningTargetTier as any)
      : undefined;

    return new UserTier(
      data.id,
      data.userId,
      data.tierId,
      data.statusExp,
      data.lifetimeExp,
      data.lastEvaluationAt,
      data.currentLevel,
      data.maxLevelAchieved,
      data.lastBonusReceivedAt,
      data.status,
      data.downgradeGracePeriodEndsAt,
      data.lastTierChangedAt,
      data.lastUpgradeAt,
      data.lastDowngradeAt,
      data.customCompRate,
      data.customWeeklyLossbackRate,
      data.customMonthlyLossbackRate,
      data.customDailyWithdrawalLimitUsd,
      data.customWeeklyWithdrawalLimitUsd,
      data.customMonthlyWithdrawalLimitUsd,
      data.isCustomWithdrawalUnlimited,
      data.isCustomDedicatedManager,
      data.note,
      data.isBonusEligible,
      data.nextEvaluationAt,
      data.preferredRewardCurrency,
      data.downgradeWarningIssuedAt,
      data.downgradeWarningTargetTierId,
      tier,
      downgradeWarningTargetTier,
    );
  }
}

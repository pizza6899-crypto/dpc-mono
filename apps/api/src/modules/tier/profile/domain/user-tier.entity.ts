import { Prisma, UserTierStatus, ExchangeCurrencyCode } from '@prisma/client';
import { Tier } from '../../definitions/domain/tier.entity';

export interface EffectiveBenefits {
    compRate: Prisma.Decimal;
    weeklyLossbackRate: Prisma.Decimal;
    monthlyLossbackRate: Prisma.Decimal;
    dailyWithdrawalLimitUsd: Prisma.Decimal;
    isWithdrawalUnlimited: boolean;
    hasDedicatedManager: boolean;
}

export class UserTier {
    constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public tierId: bigint,

        // 상태 데이터
        public lifetimeRollingUsd: Prisma.Decimal,
        public statusRollingUsd: Prisma.Decimal,
        public currentPeriodRollingUsd: Prisma.Decimal,
        public lifetimeDepositUsd: Prisma.Decimal,
        public currentPeriodDepositUsd: Prisma.Decimal,
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
        public customWithdrawalLimitUsd: Prisma.Decimal | null,
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
            weeklyLossbackRate: this.customWeeklyLossbackRate ?? tier.weeklyLossbackRate,
            monthlyLossbackRate: this.customMonthlyLossbackRate ?? tier.monthlyLossbackRate,
            dailyWithdrawalLimitUsd: this.customWithdrawalLimitUsd ?? tier.dailyWithdrawalLimitUsd,
            isWithdrawalUnlimited: this.isCustomWithdrawalUnlimited ?? tier.isWithdrawalUnlimited,
            hasDedicatedManager: this.isCustomDedicatedManager ?? tier.hasDedicatedManager,
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

        // [Policy] 강등 시 승급용 실적(statusRollingUsd)을 새 티어의 요구치로 Cap 처리합니다.
        // 이는 강등된 유저가 바로 다시 승급하는 것을 방지하고, 해당 등급에서 일정 실적을 다시 쌓게 하기 위함입니다.
        if (this.statusRollingUsd.gt(targetTier.upgradeRollingRequiredUsd)) {
            this.statusRollingUsd = targetTier.upgradeRollingRequiredUsd;
        }
    }

    setDowngradeWarning(targetTierId: bigint, graceEndsAt: Date): void {
        this.status = UserTierStatus.GRACE;
        this.downgradeGracePeriodEndsAt = graceEndsAt;
        this.downgradeWarningIssuedAt = new Date();
        this.downgradeWarningTargetTierId = targetTierId;
    }

    /**
     * 실적을 누적합니다.
     */
    incrementRolling(amount: Prisma.Decimal | number): void {
        const decimalAmount = new Prisma.Decimal(amount);
        this.lifetimeRollingUsd = this.lifetimeRollingUsd.add(decimalAmount);
        this.statusRollingUsd = this.statusRollingUsd.add(decimalAmount);
        this.currentPeriodRollingUsd = this.currentPeriodRollingUsd.add(decimalAmount);
    }

    /**
     * 입금 실적을 누적합니다.
     */
    incrementDeposit(amount: Prisma.Decimal | number): void {
        const decimalAmount = new Prisma.Decimal(amount);
        this.lifetimeDepositUsd = this.lifetimeDepositUsd.add(decimalAmount);
        this.currentPeriodDepositUsd = this.currentPeriodDepositUsd.add(decimalAmount);
    }

    /**
     * 주기적 심사 완료 후 실적을 리셋하고 상태를 ACTIVE로 복구합니다. (등급 유지 시 호출)
     */
    resetPeriodPerformance(evaluationCycleDays: number): void {
        this.currentPeriodRollingUsd = new Prisma.Decimal(0);
        this.currentPeriodDepositUsd = new Prisma.Decimal(0);
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

    static fromPersistence(data: Prisma.UserTierGetPayload<{
        include: {
            tier: { include: { translations: true } },
            downgradeWarningTargetTier: { include: { translations: true } }
        }
    }>): UserTier {
        const tier = data.tier ? Tier.fromPersistence(data.tier) : undefined;
        const downgradeWarningTargetTier = data.downgradeWarningTargetTier ? Tier.fromPersistence(data.downgradeWarningTargetTier) : undefined;

        return new UserTier(
            data.id,
            data.userId,
            data.tierId,
            data.lifetimeRollingUsd,
            data.statusRollingUsd,
            data.currentPeriodRollingUsd,
            data.lifetimeDepositUsd,
            data.currentPeriodDepositUsd,
            data.lastEvaluationAt,
            data.currentLevel,
            data.maxLevelAchieved,
            data.lastBonusReceivedAt,
            data.status as UserTierStatus,
            data.downgradeGracePeriodEndsAt,
            data.lastTierChangedAt,
            data.lastUpgradeAt,
            data.lastDowngradeAt,
            data.customCompRate,
            data.customWeeklyLossbackRate,
            data.customMonthlyLossbackRate,
            data.customWithdrawalLimitUsd,
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

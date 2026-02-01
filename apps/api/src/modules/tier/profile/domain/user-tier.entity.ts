import { Prisma, UserTierStatus } from '@prisma/client';
import { Tier } from '../../master/domain/tier.entity';

export interface EffectiveBenefits {
    compRate: Prisma.Decimal;
    lossbackRate: Prisma.Decimal;
    rakebackRate: Prisma.Decimal;
    reloadBonusRate: Prisma.Decimal;
    dailyWithdrawalLimitUsd: Prisma.Decimal;
    isWithdrawalUnlimited: boolean;
    hasDedicatedManager: boolean;
    isVIPEventEligible: boolean;
}

export class UserTier {
    constructor(
        public readonly id: bigint,
        public readonly userId: bigint,
        public tierId: bigint,
        // States
        public totalEffectiveRollingUsd: Prisma.Decimal,
        public currentPeriodRollingUsd: Prisma.Decimal,
        public totalDepositUsd: Prisma.Decimal,
        public currentPeriodDepositUsd: Prisma.Decimal,
        public lastEvaluationAt: Date,
        // Controls
        public highestPromotedRank: number,
        public lastBonusReceivedAt: Date | null,
        public status: UserTierStatus,
        public graceEndsAt: Date | null,
        public lastTierChangedAt: Date,
        // Overrides
        public customCompRate: Prisma.Decimal | null,
        public customLossbackRate: Prisma.Decimal | null,
        public customRakebackRate: Prisma.Decimal | null,
        public customReloadBonusRate: Prisma.Decimal | null,
        public customWithdrawalLimitUsd: Prisma.Decimal | null,
        public isCustomWithdrawalUnlimited: boolean | null,
        public isCustomDedicatedManager: boolean | null,
        public isCustomVipEventEligible: boolean | null,
        // Audit
        public isBonusEligible: boolean,
        public nextEvaluationAt: Date | null,
        public note: string | null,
        // Warning
        public demotionWarningIssuedAt: Date | null,
        public demotionWarningTargetTierId: bigint | null,
        // Joined Data
        public readonly tier?: Tier,
        public readonly demotionWarningTargetTier?: Tier,
    ) { }

    getEffectiveBenefits(baseTier?: Tier): EffectiveBenefits {
        const tier = baseTier || this.tier;
        if (!tier) throw new Error('Base tier is required for benefit calculation');

        return {
            compRate: this.customCompRate ?? tier.compRate,
            lossbackRate: this.customLossbackRate ?? tier.lossbackRate,
            rakebackRate: this.customRakebackRate ?? tier.rakebackRate,
            reloadBonusRate: this.customReloadBonusRate ?? tier.reloadBonusRate,
            dailyWithdrawalLimitUsd: this.customWithdrawalLimitUsd ?? tier.dailyWithdrawalLimitUsd,
            isWithdrawalUnlimited: this.isCustomWithdrawalUnlimited ?? tier.isWithdrawalUnlimited,
            hasDedicatedManager: this.isCustomDedicatedManager ?? tier.hasDedicatedManager,
            isVIPEventEligible: this.isCustomVipEventEligible ?? tier.isVIPEventEligible,
        };
    }

    /**
     * 티어를 변경하고 상태를 초기화합니다.
     * @returns 승급 보너스 지급 대상 여부
     */
    updateTier(targetTierId: bigint, rank: number): boolean {
        // 이전에 도달했던 최고 등급보다 높은 등급으로 승급할 때만 보너스 지급
        const isBonusEligibleJump = rank > this.highestPromotedRank;

        this.tierId = targetTierId;
        this.highestPromotedRank = Math.max(this.highestPromotedRank, rank);
        this.lastTierChangedAt = new Date();
        this.status = UserTierStatus.ACTIVE;
        this.graceEndsAt = null;
        this.demotionWarningIssuedAt = null;
        this.demotionWarningTargetTierId = null;

        return isBonusEligibleJump && this.isBonusEligible;
    }

    setDemotionWarning(targetTierId: bigint, graceEndsAt: Date): void {
        this.status = UserTierStatus.GRACE;
        this.graceEndsAt = graceEndsAt;
        this.demotionWarningIssuedAt = new Date();
        this.demotionWarningTargetTierId = targetTierId;
    }

    /**
     * 실적을 누적합니다.
     */
    incrementRolling(amount: Prisma.Decimal | number): void {
        const decimalAmount = new Prisma.Decimal(amount);
        this.totalEffectiveRollingUsd = this.totalEffectiveRollingUsd.add(decimalAmount);
        this.currentPeriodRollingUsd = this.currentPeriodRollingUsd.add(decimalAmount);
    }

    /**
     * 입금 실적을 누적합니다.
     */
    incrementDeposit(amount: Prisma.Decimal | number): void {
        const decimalAmount = new Prisma.Decimal(amount);
        this.totalDepositUsd = this.totalDepositUsd.add(decimalAmount);
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
        this.status = UserTierStatus.ACTIVE;
        this.graceEndsAt = null;
        this.demotionWarningIssuedAt = null;
        this.demotionWarningTargetTierId = null;

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
            demotionWarningTargetTier: { include: { translations: true } }
        }
    }>): UserTier {
        return new UserTier(
            data.id, data.userId, data.tierId,
            data.totalEffectiveRollingUsd, data.currentPeriodRollingUsd, data.totalDepositUsd, data.currentPeriodDepositUsd, data.lastEvaluationAt,
            data.highestPromotedRank, data.lastBonusReceivedAt, data.status as UserTierStatus, data.graceEndsAt, data.lastTierChangedAt,
            data.customCompRate, data.customLossbackRate, data.customRakebackRate, data.customReloadBonusRate,
            data.customWithdrawalLimitUsd, data.isCustomWithdrawalUnlimited,
            data.isCustomDedicatedManager, data.isCustomVipEventEligible,
            data.isBonusEligible, data.nextEvaluationAt, data.note,
            data.demotionWarningIssuedAt, data.demotionWarningTargetTierId,
            data.tier ? Tier.fromPersistence(data.tier) : undefined,
            data.demotionWarningTargetTier ? Tier.fromPersistence(data.demotionWarningTargetTier) : undefined
        );
    }
}

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
        public lastEvaluationAt: Date,
        // Controls
        public highestPromotedPriority: number,
        public status: UserTierStatus,
        public graceEndsAt: Date | null,
        public lastTierChangedAt: Date,
        // Overrides
        public readonly customCompRate: Prisma.Decimal | null,
        public readonly customLossbackRate: Prisma.Decimal | null,
        public readonly customRakebackRate: Prisma.Decimal | null,
        public readonly customReloadBonusRate: Prisma.Decimal | null,
        public readonly customWithdrawalLimitUsd: Prisma.Decimal | null,
        public readonly isCustomWithdrawalUnlimited: boolean | null,
        public readonly isCustomDedicatedManager: boolean | null,
        public readonly isCustomVipEventEligible: boolean | null,
        // Audit
        public readonly isBonusEligible: boolean,
        public readonly nextEvaluationAt: Date | null,
        public readonly note: string | null,
        // Joined Data
        public readonly tier?: Tier,
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

    static fromPersistence(data: any): UserTier {
        return new UserTier(
            data.id, data.userId, data.tierId,
            data.totalEffectiveRollingUsd, data.currentPeriodRollingUsd, data.lastEvaluationAt,
            data.highestPromotedPriority, data.status as UserTierStatus, data.graceEndsAt, data.lastTierChangedAt,
            data.customCompRate, data.customLossbackRate, data.customRakebackRate, data.customReloadBonusRate,
            data.customWithdrawalLimitUsd, data.isCustomWithdrawalUnlimited,
            data.isCustomDedicatedManager, data.isCustomVipEventEligible,
            data.isBonusEligible, data.nextEvaluationAt, data.note,
            data.tier ? Tier.fromPersistence(data.tier) : undefined
        );
    }
}

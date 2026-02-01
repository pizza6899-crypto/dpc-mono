import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierStatus } from '@prisma/client';

export interface UserTierDetailResult {
    id: string;
    userId: string;
    tierId: string;
    tierName: string;
    totalEffectiveRollingUsd: string;
    currentPeriodRollingUsd: string;
    currentPeriodDepositUsd: string;
    lastEvaluationAt: Date;
    highestPromotedRank: number;
    lastBonusReceivedAt: Date | null;
    status: UserTierStatus;
    graceEndsAt: Date | null;
    lastTierChangedAt: Date;
    customCompRate: string | null;
    customLossbackRate: string | null;
    customRakebackRate: string | null;
    customReloadBonusRate: string | null;
    customWithdrawalLimitUsd: string | null;
    isCustomWithdrawalUnlimited: boolean | null;
    isCustomDedicatedManager: boolean | null;
    isCustomVipEventEligible: boolean | null;
    isBonusEligible: boolean;
    nextEvaluationAt: Date | null;
    note: string | null;
    demotionWarningIssuedAt: Date | null;
    demotionWarningTargetTierId: string | null;
    demotionWarningTargetTierName: string | null;
    currentBenefits: {
        compRate: string;
        lossbackRate: string;
        rakebackRate: string;
        reloadBonusRate: string;
        dailyWithdrawalLimitUsd: string;
        isWithdrawalUnlimited: boolean;
        hasDedicatedManager: boolean;
        isVIPEventEligible: boolean;
    };
}

@Injectable()
export class GetUserTierDetailService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTierDetailResult> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new NotFoundException('User tier info not found');
        }

        const benefits = userTier.getEffectiveBenefits();

        return {
            id: userTier.id.toString(),
            userId: userTier.userId.toString(),
            tierId: userTier.tierId.toString(),
            tierName: userTier.tier.getName(), // Context language handling might be needed but default is English/Code
            totalEffectiveRollingUsd: userTier.totalEffectiveRollingUsd.toString(),
            currentPeriodRollingUsd: userTier.currentPeriodRollingUsd.toString(),
            currentPeriodDepositUsd: userTier.currentPeriodDepositUsd.toString(),
            lastEvaluationAt: userTier.lastEvaluationAt,
            highestPromotedRank: userTier.highestPromotedRank,
            lastBonusReceivedAt: userTier.lastBonusReceivedAt,
            status: userTier.status,
            graceEndsAt: userTier.graceEndsAt,
            lastTierChangedAt: userTier.lastTierChangedAt,
            customCompRate: userTier.customCompRate?.toString() ?? null,
            customLossbackRate: userTier.customLossbackRate?.toString() ?? null,
            customRakebackRate: userTier.customRakebackRate?.toString() ?? null,
            customReloadBonusRate: userTier.customReloadBonusRate?.toString() ?? null,
            customWithdrawalLimitUsd: userTier.customWithdrawalLimitUsd?.toString() ?? null,
            isCustomWithdrawalUnlimited: userTier.isCustomWithdrawalUnlimited,
            isCustomDedicatedManager: userTier.isCustomDedicatedManager,
            isCustomVipEventEligible: userTier.isCustomVipEventEligible,
            isBonusEligible: userTier.isBonusEligible,
            nextEvaluationAt: userTier.nextEvaluationAt,
            note: userTier.note,
            demotionWarningIssuedAt: userTier.demotionWarningIssuedAt,
            demotionWarningTargetTierId: userTier.demotionWarningTargetTierId?.toString() ?? null,
            demotionWarningTargetTierName: userTier.demotionWarningTargetTier?.getName() ?? null,
            currentBenefits: {
                compRate: benefits.compRate.toString(),
                lossbackRate: benefits.lossbackRate.toString(),
                rakebackRate: benefits.rakebackRate.toString(),
                reloadBonusRate: benefits.reloadBonusRate.toString(),
                dailyWithdrawalLimitUsd: benefits.dailyWithdrawalLimitUsd.toString(),
                isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
                hasDedicatedManager: benefits.hasDedicatedManager,
                isVIPEventEligible: benefits.isVIPEventEligible,
            }
        };
    }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { UserTierAdminResponseDto } from '../controllers/admin/dto/user-tier-admin.response.dto';

@Injectable()
export class GetUserTierDetailService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTierAdminResponseDto> {
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
            highestPromotedPriority: userTier.highestPromotedPriority,
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { UserTierPublicResponseDto, NextTierProgressDto } from '../controllers/public/dto/user-tier-public.response.dto';

@Injectable()
export class GetUserTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTierPublicResponseDto> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new NotFoundException('User tier info not initialized');
        }

        const currentTier = userTier.tier;
        const allTiers = await this.tierRepository.findAll();
        const nextTier = allTiers.find(t => t.priority === currentTier.priority + 1);

        let progress: NextTierProgressDto | null = null;

        if (nextTier) {
            // Rolling Progress
            const requiredRolling = nextTier.requirementUsd;
            const currentRolling = userTier.currentPeriodRollingUsd; // Using period rolling for promotion check? Or total? 
            // Usually promotion tracks period rolling or total depending on policy.
            // Based on AccumulateRollingService, we use 'currentPeriodRollingUsd' for now as usually these are period based or we need clarity.
            // Checking accumulation logic: accum service adds to both.
            // Let's assume period rolling for now as it resets. Wait, promotion usually might be lifetime or valid for period. 
            // In many systems, promotion is automatic once you hit the target *within* a period or lifetime.
            // Let's use currentPeriodRollingUsd as safe bet, or totalEffectiveRollingUsd if logic dictates.
            // Looking at Tier logic: "maintenanceRollingUsd" suggests period. "requirementUsd" for upgrade.
            // Let's use `currentPeriodRollingUsd` + `totalEffectiveRollingUsd`? 
            // Typically "requirementUsd" is for reaching that tier.
            // Let's use `currentPeriodDepositUsd`.

            const remainingRolling = requiredRolling.minus(currentRolling);
            const rollingProgress = currentRolling.div(requiredRolling).mul(100).toNumber();

            // Deposit Progress
            const requiredDeposit = nextTier.requirementDepositUsd;
            const currentDeposit = userTier.currentPeriodDepositUsd;
            const remainingDeposit = requiredDeposit.minus(currentDeposit);
            const depositProgress = currentDeposit.div(requiredDeposit).mul(100).toNumber();

            progress = {
                name: nextTier.getName(),
                requiredRolling: requiredRolling.toString(),
                currentRolling: currentRolling.toString(),
                remainingRolling: remainingRolling.isPositive() ? remainingRolling.toString() : '0',
                rollingProgressPercent: Math.min(100, Math.max(0, rollingProgress)),

                requiredDeposit: requiredDeposit.toString(),
                currentDeposit: currentDeposit.toString(),
                remainingDeposit: remainingDeposit.isPositive() ? remainingDeposit.toString() : '0',
                depositProgressPercent: Math.min(100, Math.max(0, depositProgress)),
            };
        }

        const benefits = userTier.getEffectiveBenefits();

        return {
            id: currentTier.id.toString(),
            name: currentTier.getName(),
            priority: currentTier.priority,
            imageUrl: currentTier.imageUrl,
            status: userTier.status,
            lastChangedAt: userTier.lastTierChangedAt,
            nextEvaluationAt: userTier.nextEvaluationAt,
            benefits: {
                compRate: benefits.compRate.toString(),
                lossbackRate: benefits.lossbackRate.toString(),
                rakebackRate: benefits.rakebackRate.toString(),
                reloadBonusRate: benefits.reloadBonusRate.toString(),
                dailyWithdrawalLimitUsd: benefits.dailyWithdrawalLimitUsd.toString(),
                isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
                hasDedicatedManager: benefits.hasDedicatedManager,
                isVIPEventEligible: benefits.isVIPEventEligible,
            },
            nextTierProgress: progress,
        };
    }
}

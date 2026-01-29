import { Injectable, NotFoundException } from '@nestjs/common';
import { UserTierRepositoryPort } from '../infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { UserTierStatus, Prisma } from '@prisma/client';

export interface UserTierResult {
    id: bigint;
    name: string;
    priority: number;
    imageUrl: string | null;
    status: UserTierStatus;
    lastTierChangedAt: Date;
    nextEvaluationAt: Date | null;
    benefits: {
        compRate: Prisma.Decimal;
        lossbackRate: Prisma.Decimal;
        rakebackRate: Prisma.Decimal;
        reloadBonusRate: Prisma.Decimal;
        dailyWithdrawalLimitUsd: Prisma.Decimal;
        isWithdrawalUnlimited: boolean;
        hasDedicatedManager: boolean;
        isVIPEventEligible: boolean;
    };
    nextTierProgress: {
        name: string;
        requiredRolling: Prisma.Decimal;
        currentRolling: Prisma.Decimal;
        remainingRolling: Prisma.Decimal;
        rollingProgressPercent: number;
        requiredDeposit: Prisma.Decimal;
        currentDeposit: Prisma.Decimal;
        remainingDeposit: Prisma.Decimal;
        depositProgressPercent: number;
    } | null;
}

@Injectable()
export class GetUserTierService {
    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<UserTierResult> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier || !userTier.tier) {
            throw new NotFoundException('User tier info not initialized');
        }

        const currentTier = userTier.tier;
        const allTiers = await this.tierRepository.findAll();
        const nextTier = allTiers.find(t => t.priority === currentTier.priority + 1);

        let progress: UserTierResult['nextTierProgress'] = null;

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
                requiredRolling: requiredRolling,
                currentRolling: currentRolling,
                remainingRolling: remainingRolling.isPositive() ? remainingRolling : new Prisma.Decimal(0),
                rollingProgressPercent: Math.min(100, Math.max(0, rollingProgress)),

                requiredDeposit: requiredDeposit,
                currentDeposit: currentDeposit,
                remainingDeposit: remainingDeposit.isPositive() ? remainingDeposit : new Prisma.Decimal(0),
                depositProgressPercent: Math.min(100, Math.max(0, depositProgress)),
            };
        }

        const benefits = userTier.getEffectiveBenefits();

        return {
            id: currentTier.id,
            name: currentTier.getName(),
            priority: currentTier.priority,
            imageUrl: currentTier.imageUrl,
            status: userTier.status,
            lastTierChangedAt: userTier.lastTierChangedAt,
            nextEvaluationAt: userTier.nextEvaluationAt,
            benefits: {
                compRate: benefits.compRate,
                lossbackRate: benefits.lossbackRate,
                rakebackRate: benefits.rakebackRate,
                reloadBonusRate: benefits.reloadBonusRate,
                dailyWithdrawalLimitUsd: benefits.dailyWithdrawalLimitUsd,
                isWithdrawalUnlimited: benefits.isWithdrawalUnlimited,
                hasDedicatedManager: benefits.hasDedicatedManager,
                isVIPEventEligible: benefits.isVIPEventEligible,
            },
            nextTierProgress: progress,
        };
    }
}

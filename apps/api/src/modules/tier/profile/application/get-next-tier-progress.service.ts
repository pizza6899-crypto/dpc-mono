import { Injectable } from '@nestjs/common';
import { Prisma, Language } from '@prisma/client';
import { UserTier } from '../domain/user-tier.entity';
import { Tier } from '../../master/domain/tier.entity';

export interface NextTierProgressResult {
    id: bigint;
    name: string;
    imageUrl: string | null;
    requiredRolling: Prisma.Decimal;
    currentRolling: Prisma.Decimal;
    remainingRolling: Prisma.Decimal;
    rollingProgressPercent: number;
    requiredDeposit: Prisma.Decimal;
    currentDeposit: Prisma.Decimal;
    remainingDeposit: Prisma.Decimal;
    depositProgressPercent: number;
}

@Injectable()
export class GetNextTierProgressService {
    /**
     * 유저의 현재 티어 정보를 바탕으로 다음 티어 승급 진행률을 계산합니다.
     * 엔티티를 직접 전달받아 DB 조회를 최소화합니다.
     */
    execute(userTier: UserTier, allTiers: Tier[], language: Language): NextTierProgressResult | null {
        if (!userTier.tier) return null;

        const currentTier = userTier.tier;

        // Find next tier by priority
        const nextTier = allTiers.find(t => t.priority === currentTier.priority + 1);
        if (!nextTier) return null;

        // Rolling Progress (Promotion is based on Lifetime/Total rolling as per requirementUsd policy)
        const requiredRolling = nextTier.requirementUsd;
        const currentRolling = userTier.totalEffectiveRollingUsd;
        const remainingRolling = requiredRolling.minus(currentRolling);
        const rollingProgress = requiredRolling.gt(0)
            ? currentRolling.div(requiredRolling).mul(100).toNumber()
            : 100;

        // Deposit Progress
        const requiredDeposit = nextTier.requirementDepositUsd;
        const currentDeposit = userTier.currentPeriodDepositUsd;
        const remainingDeposit = requiredDeposit.minus(currentDeposit);
        const depositProgress = requiredDeposit.gt(0)
            ? currentDeposit.div(requiredDeposit).mul(100).toNumber()
            : 100;

        return {
            id: nextTier.id,
            name: nextTier.getName(language),
            imageUrl: nextTier.imageUrl,
            requiredRolling,
            currentRolling,
            remainingRolling: remainingRolling.isPositive() ? remainingRolling : new Prisma.Decimal(0),
            rollingProgressPercent: Math.min(100, Math.max(0, rollingProgress)),
            requiredDeposit,
            currentDeposit,
            remainingDeposit: remainingDeposit.isPositive() ? remainingDeposit : new Prisma.Decimal(0),
            depositProgressPercent: Math.min(100, Math.max(0, depositProgress)),
        };
    }
}

import { Injectable } from '@nestjs/common';
import { Tier } from '../../master/domain/tier.entity';
import { UserTier } from '../../profile/domain/user-tier.entity';

@Injectable()
export class PromotionPolicy {
    /**
     * 유저가 대상 티어의 자격 요건(롤링액 및 입금액)을 갖추었는지 확인합니다.
     */
    checkQualification(userTier: UserTier, candidateTier: Tier): boolean {
        const isRollingMet = userTier.totalEffectiveRollingUsd.gte(candidateTier.requirementUsd);
        const isDepositMet = userTier.totalDepositUsd.gte(candidateTier.requirementDepositUsd);

        return isRollingMet && isDepositMet;
    }

    /**
     * 전체 티어 목록 중 유저가 도달할 수 있는 가장 높은 티어를 찾습니다.
     */
    findEligibleTier(userTier: UserTier, allTiers: Tier[]): Tier | null {
        const currentRank = userTier.tier?.rank ?? 0;

        return allTiers
            .filter(t => t.rank > currentRank)
            .sort((a, b) => b.rank - a.rank) // 높은 rank 우선
            .find(t => this.checkQualification(userTier, t)) ?? null;
    }
}

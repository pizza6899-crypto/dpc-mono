import { Injectable } from '@nestjs/common';
import { Tier } from '../../master/domain/tier.entity';
import { UserTier } from '../../profile/domain/user-tier.entity';

@Injectable()
export class PromotionPolicy {
    /**
     * 유저가 대상 티어의 자격 요건(롤링액 및 입금액)을 갖추었는지 확인합니다.
     */
    checkQualification(userTier: UserTier, candidateTier: Tier): boolean {
        // [Policy] 승급(Upgrade) 판정에 사용되는 실적은 statusRollingUsd와 lifetimeDepositUsd입니다.
        const isRollingMet = userTier.statusRollingUsd.gte(candidateTier.upgradeRollingRequiredUsd);
        const isDepositMet = userTier.lifetimeDepositUsd.gte(candidateTier.upgradeDepositRequiredUsd);

        return isRollingMet && isDepositMet;
    }

    /**
     * 전체 티어 목록 중 유저가 도달할 수 있는 가장 높은 티어를 찾습니다.
     */
    findEligibleTier(userTier: UserTier, allTiers: Tier[]): Tier | null {
        // [Policy] 현재 레벨보다 높은 레벨 중에서 자격 요건을 충족하는 최상위 티어를 검색합니다.
        const currentLevel = userTier.currentLevel;

        return allTiers
            .filter(t => t.level > currentLevel)
            .sort((a, b) => b.level - a.level) // 높은 level 우선 (최상위 목표 티어 선정)
            .find(t => this.checkQualification(userTier, t)) ?? null;
    }
}

import { Injectable } from '@nestjs/common';
import { Tier } from '../../config/domain/tier.entity';
import { UserTier } from '../../profile/domain/user-tier.entity';
import { UserTierStatus } from '@prisma/client';

@Injectable()
export class PromotionPolicy {
  /**
   * 유저가 대상 티어의 자격 요건(XP)을 갖추었는지 확인합니다.
   */
  checkQualification(userTier: UserTier, candidateTier: Tier): boolean {
    // [Policy] 승급(Upgrade) 판정은 유저의 현재 승계 XP(statusExp)가 티어의 요구 XP(upgradeExpRequired) 이상인지 확인합니다.
    return userTier.statusExp >= candidateTier.upgradeExpRequired;
  }

  /**
   * 전체 티어 목록 중 유저가 도달할 수 있는 가장 높은 티어를 찾습니다.
   */
  findEligibleTier(userTier: UserTier, allTiers: Tier[]): Tier | null {
    // 0. 잠금 상태 확인 (LOCKED인 경우 자동 승급 대상에서 제외)
    if (userTier.status === UserTierStatus.LOCKED) {
      return null;
    }

    // [Policy] 현재 레벨보다 높은 레벨 중에서 자격 요건을 충족하는 최상위 티어를 검색합니다.
    const currentLevel = userTier.currentLevel;

    return (
      allTiers
        .filter(
          (t) =>
            t.level > currentLevel &&
            t.isActive && // 활성화된 티어만 대상
            !t.isManualOnly, // 자동 배치 심사에서는 수동 전용 티어 제외
        )
        .sort((a, b) => b.level - a.level) // 높은 level 우선 (최상위 목표 티어 선정)
        .find((t) => this.checkQualification(userTier, t)) ?? null
    );
  }
}

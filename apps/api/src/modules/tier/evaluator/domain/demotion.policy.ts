import { Injectable } from '@nestjs/common';
import { UserTier } from '../../profile/domain/user-tier.entity';
import { Tier } from '../../config/domain/tier.entity';
import { UserTierStatus } from '@prisma/client';

export interface DemotionResult {
  action: 'MAINTAIN' | 'GRACE' | 'DEMOTE';
  targetTier?: Tier;
  graceEndsAt?: Date;
}

@Injectable()
export class DemotionPolicy {
  /**
   * [Warning] 현재 티어 스키마에서 유지 요구량(maintainRollingRequiredUsd)이 제거되었습니다.
   * 임시적으로 모든 유저를 MAINTAIN 상태로 판정합니다. (향후 XP 기반 유지 조건 도입 시 수정 필요)
   */
  evaluate(
    userTier: UserTier,
    allTiers: Tier[],
    defaultGracePeriodDays: number,
  ): DemotionResult {
    // 0. 잠금 상태 확인
    if (userTier.status === UserTierStatus.LOCKED) {
      return { action: 'MAINTAIN' };
    }

    // [TODO] 스키마에 유지 조건(예: 유지용 XP)이 없으므로 현재는 항상 유지 처리합니다.
    return { action: 'MAINTAIN' };
  }
}

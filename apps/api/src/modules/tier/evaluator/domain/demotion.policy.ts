import { Injectable } from '@nestjs/common';
import { UserTier } from '../../profile/domain/user-tier.entity';
import { Tier } from '../../master/domain/tier.entity';
import { UserTierStatus } from '@prisma/client';

export interface DemotionResult {
    action: 'MAINTAIN' | 'GRACE' | 'DEMOTE';
    targetTier?: Tier;
    graceEndsAt?: Date;
}

@Injectable()
export class DemotionPolicy {
    evaluate(userTier: UserTier, allTiers: Tier[], defaultGracePeriodDays: number): DemotionResult {
        if (!userTier.tier) return { action: 'MAINTAIN' };

        // 0. 잠금 상태 확인 (LOCKED인 경우 심사 제외)
        if (userTier.status === UserTierStatus.LOCKED) {
            return { action: 'MAINTAIN' };
        }

        // 1. 유지 조건 확인 (현재 기간 롤링액이 티어 유지 요구량보다 큰지)
        // [Policy] 유지(Maintain) 판정에 사용되는 실적은 currentPeriodRollingUsd입니다.
        const isMaintenanceMet = userTier.currentPeriodRollingUsd.gte(userTier.tier.maintainRollingRequiredUsd);
        if (isMaintenanceMet) return { action: 'MAINTAIN' };

        // 2. 조건 미달 시: 현재 상태에 따른 판단
        if (userTier.status === UserTierStatus.GRACE) {
            const now = new Date();
            if (userTier.downgradeGracePeriodEndsAt && userTier.downgradeGracePeriodEndsAt <= now) {
                // 유예 기간 종료 -> 강등 확정
                // [Soft Landing] 현재 등급보다 낮은 레벨 중 가장 높은 등급을 찾음 (Next Lower Tier)
                const nextLowerTier = allTiers
                    .filter(t => t.level < userTier.currentLevel)
                    .sort((a, b) => b.level - a.level)[0];

                return nextLowerTier
                    ? { action: 'DEMOTE', targetTier: nextLowerTier }
                    : { action: 'MAINTAIN' }; // 이미 최하위 티어라면 유지(이론상 도달 불가)
            }
            return { action: 'MAINTAIN' }; // 유예 기간 중이면 이번 주기에는 강등 유실 방지(유지)
        } else {
            // [Initial Warning] 정상 상태(ACTIVE)에서 조건 미달 -> 유예 기간(Grace) 진입
            const graceEndsAt = new Date();
            graceEndsAt.setUTCDate(graceEndsAt.getUTCDate() + defaultGracePeriodDays);

            // 강등될 타겟 티어 미리 선정 (유예 기간 종료 후 이동할 곳)
            const nextLowerTier = allTiers
                .filter(t => t.level < userTier.currentLevel)
                .sort((a, b) => b.level - a.level)[0];

            return {
                action: 'GRACE',
                graceEndsAt,
                targetTier: nextLowerTier ?? undefined
            };
        }
    }
}

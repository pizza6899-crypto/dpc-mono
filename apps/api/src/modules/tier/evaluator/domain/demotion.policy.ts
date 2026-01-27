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
    evaluate(userTier: UserTier, allTiers: Tier[]): DemotionResult {
        if (!userTier.tier) return { action: 'MAINTAIN' };

        // 1. 유지 조건 확인 (현재 기간 롤링액이 티어 유지 요구량보다 큰지)
        const isMaintenanceMet = userTier.currentPeriodRollingUsd.gte(userTier.tier.maintenanceRollingUsd);
        if (isMaintenanceMet) return { action: 'MAINTAIN' };

        // 2. 조건 미달 시: 현재 상태에 따른 판단
        if (userTier.status === UserTierStatus.GRACE) {
            const now = new Date();
            if (userTier.graceEndsAt && userTier.graceEndsAt < now) {
                // 유예 기간 종료 -> 강등 (Soft Landing: 한 단계 아래 등급 중 가장 높은 곳)
                const nextLowerTier = allTiers
                    .filter(t => t.priority < userTier.tier!.priority)
                    .sort((a, b) => b.priority - a.priority)[0];

                return nextLowerTier
                    ? { action: 'DEMOTE', targetTier: nextLowerTier }
                    : { action: 'MAINTAIN' };
            }
            return { action: 'MAINTAIN' }; // 유예 기간 중이면 대기
        } else {
            // 정상 상태에서 조건 미달 -> 유예 기간(Grace) 진입 (7일 부여)
            const graceEndsAt = new Date();
            graceEndsAt.setDate(graceEndsAt.getDate() + 7);
            return { action: 'GRACE', graceEndsAt };
        }
    }
}

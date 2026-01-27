
import { Injectable, Logger } from '@nestjs/common';
import { TierRepository } from '../../core/infrastructure/tier.repository';
import { UserTierRepository } from '../../core/infrastructure/user-tier.repository';
import { PromotionPolicy } from '../domain/promotion.policy';
import { Tier } from '../../core/domain/tier.entity';
import { UserTier } from '../../core/domain/user-tier.entity';

@Injectable()
export class CheckPromotionService {
    private readonly logger = new Logger(CheckPromotionService.name);

    constructor(
        private readonly tierRepository: TierRepository,
        private readonly userTierRepository: UserTierRepository,
        private readonly promotionPolicy: PromotionPolicy,
    ) { }

    /**
     * 해당 유저가 승급 대상인지 확인하고, 승급 가능하면 대상 Tier를 반환합니다.
     * 승급 대상이 아니면 null을 반환합니다.
     */
    async check(userId: bigint): Promise<Tier | null> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) {
            this.logger.warn(`UserTier not found for user ${userId}`);
            return null;
        }

        // 현재 티어 정보가 없으면 로직 수행 불가 (일관성 문제)
        if (!userTier.tier) {
            this.logger.error(`UserTier ${userTier.id} has no linked Tier entity.`);
            return null;
        }

        // 이미 최고 티어인지 확인 필요하지만, 전체 티어 목록에서 우선순위 비교로 자연스럽게 처리됨.

        // 전체 티어 목록 조회 (성능 최적화를 위해 캐싱 고려 필요)
        const allTiers = await this.tierRepository.findAll();

        // 현재 티어보다 높은 우선순위의 티어들만 필터링 후 내림차순 정렬 (가장 높은 티어부터 검사)
        const candidateTiers = allTiers
            .filter(t => t.priority > userTier.tier!.priority)
            .sort((a, b) => b.priority - a.priority);

        for (const candidateTier of candidateTiers) {
            const isEligible = this.promotionPolicy.checkQualification(userTier, candidateTier);
            if (isEligible) {
                // 가장 높은 자격 티어 발견 시 즉시 반환 (Jumping)
                this.logger.log(`User ${userId} is eligible for promotion to ${candidateTier.name} (Priority: ${candidateTier.priority})`);
                return candidateTier;
            }
        }

        return null;
    }
}

import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { PromotionPolicy } from '../domain/promotion.policy';
import { PromotionService } from './promotion.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class AccumulateRollingService {
    private readonly logger = new Logger(AccumulateRollingService.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly promotionPolicy: PromotionPolicy,
        private readonly promotionService: PromotionService,
    ) { }

    @Transactional()
    async execute(userId: bigint, amountUsd: number): Promise<void> {
        if (amountUsd <= 0) return;

        try {
            // 1. 원자적 처리 (Repository 메서드 사용)
            await this.userTierRepository.incrementRolling(userId, amountUsd);

            // 2. 비동기 승급 심사 (실제로 트랜잭션 밖으로 나가는 것이 안전할 수 있으나, 
            // 현재 구조에서는 동기적으로 호출하여 한 트랜잭션으로 처리하거나 
            // 별도 이벤트를 발행하는 것이 좋음. 여기서는 기존 로직 유지하되 Repository 사용)
            await this.attemptPromotion(userId);

        } catch (error) {
            this.logger.error(`Failed to accumulate rolling: ${error.message}`);
            throw error;
        }
    }

    private async attemptPromotion(userId: bigint): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) return;

        const allTiers = await this.tierRepository.findAll();
        const nextTier = this.promotionPolicy.findEligibleTier(userTier, allTiers);

        if (nextTier) {
            await this.promotionService.execute(userId, nextTier);
        }
    }
}

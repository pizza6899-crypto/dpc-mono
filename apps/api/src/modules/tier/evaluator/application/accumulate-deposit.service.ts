import { Injectable, Logger } from '@nestjs/common';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { PromotionPolicy } from '../domain/promotion.policy';
import { PromotionService } from './promotion.service';
import { Transactional } from '@nestjs-cls/transactional';

@Injectable()
export class AccumulateDepositService {
    private readonly logger = new Logger(AccumulateDepositService.name);

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
            // 1. 입금 실적 누적
            await this.userTierRepository.incrementDeposit(userId, amountUsd);

            // 2. 승급 심사 (입금으로 인해 승급 조건을 달성할 수도 있음)
            await this.attemptPromotion(userId);

        } catch (error) {
            this.logger.error(`Failed to accumulate deposit: ${error.message}`);
            throw error;
        }
    }

    private async attemptPromotion(userId: bigint): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);
        if (!userTier) return;

        const allTiers = await this.tierRepository.findAll();
        const nextTier = this.promotionPolicy.findEligibleTier(userTier, allTiers);

        if (nextTier) {
            await this.promotionService.execute(userId, nextTier, 'Automatic promotion (Deposit met requirement)');
        }
    }
}

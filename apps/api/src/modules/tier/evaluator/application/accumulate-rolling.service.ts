import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/prisma/prisma.service';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository';
import { TierRepositoryPort } from '../../master/infrastructure/master.repository.port';
import { PromotionPolicy } from '../domain/promotion.policy';
import { PromotionService } from './promotion.service';

@Injectable()
export class AccumulateRollingService {
    private readonly logger = new Logger(AccumulateRollingService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        private readonly promotionPolicy: PromotionPolicy,
        private readonly promotionService: PromotionService,
    ) { }

    async execute(userId: bigint, amountUsd: number): Promise<void> {
        if (amountUsd <= 0) return;

        try {
            // 1. 원자적 처리 (Atomic Update)
            await this.prisma.userTier.updateMany({
                where: { userId },
                data: {
                    totalEffectiveRollingUsd: { increment: amountUsd },
                    currentPeriodRollingUsd: { increment: amountUsd },
                }
            });

            // 2. 비동기 승급 심사
            this.attemptPromotion(userId).catch(err => {
                this.logger.error(`Promotion attempt failed for user ${userId}: ${err.message}`);
            });

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

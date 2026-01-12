// src/modules/tier/application/get-affiliate-rate.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@repo/database';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { USER_TIER_REPOSITORY } from '../ports/repository.token';
import { UserTierNotFoundException } from '../domain';

interface GetAffiliateRateResult {
    rate: Prisma.Decimal;
    isCustom: boolean;
}

@Injectable()
export class GetAffiliateRateService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<GetAffiliateRateResult> {
        const userTier = await this.userTierRepository.findByUserId(userId);

        if (!userTier) {
            throw new UserTierNotFoundException(userId);
        }

        if (!userTier.tier) {
            throw new UserTierNotFoundException(userId);
        }

        if (userTier.isAffiliateCustomRate && userTier.affiliateCustomRate) {
            return {
                rate: userTier.affiliateCustomRate,
                isCustom: true,
            };
        }

        return {
            rate: userTier.tier.affiliateCommissionRate,
            isCustom: false,
        };
    }
}

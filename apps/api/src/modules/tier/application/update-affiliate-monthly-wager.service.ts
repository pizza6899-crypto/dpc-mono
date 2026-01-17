// src/modules/tier/application/update-affiliate-monthly-wager.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma';
import type { UserTierRepositoryPort } from '../ports/user-tier.repository.port';
import { USER_TIER_REPOSITORY } from '../ports/repository.token';
import { UserTierNotFoundException } from '../domain';

interface UpdateAffiliateMonthlyWagerParams {
    userId: bigint;
    wagerAmount: Prisma.Decimal;
}

@Injectable()
export class UpdateAffiliateMonthlyWagerService {
    constructor(
        @Inject(USER_TIER_REPOSITORY)
        private readonly userTierRepository: UserTierRepositoryPort,
    ) { }

    async execute({
        userId,
        wagerAmount,
    }: UpdateAffiliateMonthlyWagerParams): Promise<void> {
        const userTier = await this.userTierRepository.findByUserId(userId);

        if (!userTier) {
            throw new UserTierNotFoundException(userId);
        }

        userTier.addAffiliateMonthlyWager(wagerAmount);
        await this.userTierRepository.update(userTier);
    }
}

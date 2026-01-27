import { Injectable } from '@nestjs/common';
import { GetUserTierService } from './get-user-tier.service';
import { EffectiveBenefits } from '../domain/user-tier.entity';

@Injectable()
export class CalculateEffectiveBenefitsService {
    constructor(private readonly getUserTierService: GetUserTierService) { }

    async execute(userId: bigint): Promise<EffectiveBenefits> {
        const userTier = await this.getUserTierService.execute(userId);

        if (!userTier.tier) {
            // Should rarely happen due to GetUserTierService logic
            throw new Error(`Tier data not linked for user ${userId}`);
        }

        return userTier.getEffectiveBenefits(userTier.tier);
    }
}

import { Injectable, Inject } from '@nestjs/common';
import { TierConfig } from '../domain/tier-config.entity';
import {
    TIER_CONFIG_REPOSITORY,
    type TierConfigRepositoryPort,
} from '../infrastructure/tier-config.repository.port';

@Injectable()
export class GetTierConfigService {
    constructor(
        @Inject(TIER_CONFIG_REPOSITORY)
        private readonly repository: TierConfigRepositoryPort,
    ) { }

    async execute(): Promise<TierConfig> {
        const config = await this.repository.find();
        if (config) return config;

        // Return default config if not found
        // id=0n (temp), promotion=true, downgrade=false, hour=0
        return new TierConfig(0n, true, false, 0, new Date(), null);
    }
}

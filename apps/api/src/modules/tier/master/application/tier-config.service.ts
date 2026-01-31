import { Injectable } from '@nestjs/common';
import { TierConfigRepositoryPort } from '../infrastructure/tier-config.repository.port';
import { TierConfig } from '../domain/tier-config.entity';
import { TierConfigNotFoundException } from '../domain/tier-master.exception';

@Injectable()
export class TierConfigService {
    constructor(
        private readonly repository: TierConfigRepositoryPort,
    ) { }

    async find(): Promise<TierConfig> {
        const config = await this.repository.find();
        if (!config) {
            throw new TierConfigNotFoundException();
        }

        return config;
    }

    async update(props: {
        isPromotionEnabled?: boolean;
        isDowngradeEnabled?: boolean;
        isBonusEnabled?: boolean;
        defaultGracePeriodDays?: number;
        triggerIntervalMinutes?: number;
        updatedBy: bigint;
    }): Promise<TierConfig> {
        return this.repository.update(props);
    }
}

import { Injectable } from '@nestjs/common';
import { TierSettingsRepositoryPort } from '../infrastructure/tier-settings.repository.port';
import { TierSettings } from '../domain/tier-settings.entity';
import { TierSettingsNotFoundException } from '../domain/tier-master.exception';

@Injectable()
export class TierSettingsService {
    constructor(
        private readonly repository: TierSettingsRepositoryPort,
    ) { }

    async find(): Promise<TierSettings> {
        const settings = await this.repository.find();
        if (!settings) {
            throw new TierSettingsNotFoundException();
        }

        return settings;
    }

    async update(props: {
        isPromotionEnabled?: boolean;
        isDowngradeEnabled?: boolean;
        updatedBy: bigint;
    }): Promise<TierSettings> {
        const existing = await this.find();

        return this.repository.update({
            ...props,
            evaluationHourUtc: existing.evaluationHourUtc,
        });
    }
}

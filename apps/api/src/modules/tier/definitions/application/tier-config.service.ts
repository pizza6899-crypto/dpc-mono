import { Injectable } from '@nestjs/common';
import { TierConfigRepositoryPort, UpdateTierConfigProps } from '../infrastructure/tier-config.repository.port';
import { TierConfig } from '../domain/tier-config.entity';
import { TierConfigNotFoundException } from '../domain/tier-definitions.exception';

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

    async update(props: UpdateTierConfigProps): Promise<TierConfig> {
        return this.repository.update(props);
    }
}

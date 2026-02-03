import { Inject, Injectable } from '@nestjs/common';
import { WAGERING_CONFIG_REPOSITORY } from '../ports/wagering-config.repository.port';
import type { WageringConfigRepositoryPort } from '../ports/wagering-config.repository.port';
import { WageringConfig } from '../domain/wagering-config.entity';

@Injectable()
export class GetWageringConfigService {
    constructor(
        @Inject(WAGERING_CONFIG_REPOSITORY)
        private readonly repository: WageringConfigRepositoryPort,
    ) { }

    async execute(): Promise<WageringConfig> {
        return await this.repository.get();
    }
}

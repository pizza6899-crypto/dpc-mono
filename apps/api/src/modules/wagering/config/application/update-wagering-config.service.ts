import { Inject, Injectable } from '@nestjs/common';
import { WAGERING_CONFIG_REPOSITORY } from '../ports/wagering-config.repository.port';
import type { WageringConfigRepositoryPort } from '../ports/wagering-config.repository.port';
import { WageringConfig } from '../domain/wagering-config.entity';
import { Transactional } from '@nestjs-cls/transactional';

interface UpdateWageringConfigCommand {
    defaultBonusExpiryDays?: number;
    currencySettings?: any;
    isWageringCheckEnabled?: boolean;
    isAutoCancellationEnabled?: boolean;
    adminUserId: bigint;
}

@Injectable()
export class UpdateWageringConfigService {
    constructor(
        @Inject(WAGERING_CONFIG_REPOSITORY)
        private readonly repository: WageringConfigRepositoryPort,
    ) { }

    @Transactional()
    async execute(command: UpdateWageringConfigCommand): Promise<WageringConfig> {
        const config = await this.repository.getConfig();

        config.update({
            defaultBonusExpiryDays: command.defaultBonusExpiryDays,
            currencySettings: command.currencySettings,
            isWageringCheckEnabled: command.isWageringCheckEnabled,
            isAutoCancellationEnabled: command.isAutoCancellationEnabled,
            updatedBy: command.adminUserId,
        });

        return await this.repository.save(config);
    }
}

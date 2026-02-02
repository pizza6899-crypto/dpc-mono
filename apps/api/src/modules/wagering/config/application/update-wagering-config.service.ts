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
        const current = await this.repository.getConfig();

        // 불변 엔티티 패턴: 기존 값을 기반으로 새로운 값 반영하여 인스턴스 생성
        const updatedConfig = WageringConfig.fromPersistence({
            id: current.id,
            defaultBonusExpiryDays: command.defaultBonusExpiryDays ?? current.defaultBonusExpiryDays,
            currencySettings: command.currencySettings ?? current.currencySettings,
            isWageringCheckEnabled: command.isWageringCheckEnabled ?? current.isWageringCheckEnabled,
            isAutoCancellationEnabled: command.isAutoCancellationEnabled ?? current.isAutoCancellationEnabled,
            updatedBy: command.adminUserId,
            updatedAt: new Date(),
        });

        return await this.repository.save(updatedConfig);
    }
}

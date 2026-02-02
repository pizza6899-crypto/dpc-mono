import { Inject, Injectable } from '@nestjs/common';
import { WAGERING_CONFIG_REPOSITORY } from '../ports/wagering-config.repository.port';
import type { WageringConfigRepositoryPort } from '../ports/wagering-config.repository.port';
import { WageringConfig } from '../domain/wagering-config.entity';
import { WageringCurrencySetting } from '../domain/value-objects/wagering-currency-setting.vo';
import { Transactional } from '@nestjs-cls/transactional';

import { ExchangeCurrencyCode } from '@prisma/client';
import { InvalidWageringConfigException } from '../domain/wagering-config.exception';
import { UpdateWageringCurrencySettingDto } from '../controllers/admin/dto/request/update-wagering-config.dto';

interface UpdateWageringConfigCommand {
    defaultBonusExpiryDays?: number;
    currencySettings?: Record<string, UpdateWageringCurrencySettingDto>;
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

        // 1. 통화 설정 검증 및 반영
        let updatedCurrencySettings = { ...current.currencySettings };
        if (command.currencySettings) {
            const validCurrencies = Object.values(ExchangeCurrencyCode) as string[];

            for (const [currency, data] of Object.entries(command.currencySettings)) {
                // 시스템 지원 통화 여부 체크
                if (!validCurrencies.includes(currency)) {
                    throw new InvalidWageringConfigException(`Unsupported currency: ${currency}`);
                }

                // VO로 변환 (내부적으로 금액 검증 수행)
                updatedCurrencySettings[currency] = WageringCurrencySetting.fromRaw(data as any);
            }
        }

        // 2. 불변 엔티티 패턴: 기존 값을 기반으로 새로운 값 반영하여 인스턴스 생성
        const updatedConfig = WageringConfig.fromPersistence({
            id: current.id,
            defaultBonusExpiryDays: command.defaultBonusExpiryDays ?? current.defaultBonusExpiryDays,
            currencySettings: updatedCurrencySettings,
            isWageringCheckEnabled: command.isWageringCheckEnabled ?? current.isWageringCheckEnabled,
            isAutoCancellationEnabled: command.isAutoCancellationEnabled ?? current.isAutoCancellationEnabled,
            updatedBy: command.adminUserId,
            updatedAt: new Date(),
        });

        return await this.repository.save(updatedConfig);
    }
}

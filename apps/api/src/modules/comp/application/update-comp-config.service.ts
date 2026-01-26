import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { COMP_CONFIG_REPOSITORY } from '../ports/repository.token';
import type { CompConfigRepositoryPort } from '../ports';
import { CompConfig } from '../domain';

export interface UpdateCompConfigParams {
    currency: ExchangeCurrencyCode;
    isEarnEnabled?: boolean;
    isClaimEnabled?: boolean;
    allowNegativeBalance?: boolean;
    minClaimAmount?: Prisma.Decimal;
    maxDailyEarnPerUser?: Prisma.Decimal;
    expirationDays?: number;
    description?: string;
}

@Injectable()
export class UpdateCompConfigService {
    constructor(
        @Inject(COMP_CONFIG_REPOSITORY)
        private readonly compConfigRepository: CompConfigRepositoryPort,
    ) { }

    async execute(params: UpdateCompConfigParams): Promise<CompConfig> {
        const { currency, ...updateData } = params;

        // 1. Get existing config
        let config = await this.compConfigRepository.getConfig(currency);

        if (!config) {
            // 2. Create if not exists (though seeder should have handled this)
            config = CompConfig.create({
                currency,
                isEarnEnabled: updateData.isEarnEnabled ?? true,
                isClaimEnabled: updateData.isClaimEnabled ?? true,
                allowNegativeBalance: updateData.allowNegativeBalance ?? true,
                minClaimAmount: updateData.minClaimAmount ?? new Prisma.Decimal(0),
                maxDailyEarnPerUser: updateData.maxDailyEarnPerUser ?? new Prisma.Decimal(0),
                expirationDays: updateData.expirationDays ?? 99999,
                description: updateData.description,
            });
        } else {
            // 3. Update existing config
            // In a more complex domain, we might have a method like config.update(params)
            // For now, rehydrate with new values
            config = CompConfig.rehydrate({
                id: config.id,
                currency: config.currency,
                isEarnEnabled: updateData.isEarnEnabled ?? config.isEarnEnabled,
                isClaimEnabled: updateData.isClaimEnabled ?? config.isClaimEnabled,
                allowNegativeBalance: updateData.allowNegativeBalance ?? config.allowNegativeBalance,
                minClaimAmount: updateData.minClaimAmount ?? config.minClaimAmount,
                maxDailyEarnPerUser: updateData.maxDailyEarnPerUser ?? config.maxDailyEarnPerUser,
                expirationDays: updateData.expirationDays ?? config.expirationDays,
                description: updateData.description ?? config.description,
                updatedAt: new Date(),
            });
        }

        // 4. Save
        return await this.compConfigRepository.save(config);
    }
}

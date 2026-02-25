import { Inject, Injectable } from '@nestjs/common';
import { ExchangeCurrencyCode, Prisma } from '@prisma/client';
import { COMP_CONFIG_REPOSITORY } from '../ports/repository.token';
import type { CompConfigRepositoryPort } from '../ports';
import { CompConfig } from '../domain';

export interface UpdateCompConfigParams {
  currency: ExchangeCurrencyCode;
  isEarnEnabled?: boolean;
  isSettlementEnabled?: boolean;
  minSettlementAmount?: Prisma.Decimal;
  maxDailyEarnPerUser?: Prisma.Decimal;
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
        isSettlementEnabled: updateData.isSettlementEnabled ?? true,
        minSettlementAmount: updateData.minSettlementAmount ?? new Prisma.Decimal(0),
        maxDailyEarnPerUser: updateData.maxDailyEarnPerUser ?? new Prisma.Decimal(0),
        description: updateData.description,
      });
    } else {
      // 3. Update existing config
      config = CompConfig.rehydrate({
        id: config.id,
        currency: config.currency,
        isEarnEnabled: updateData.isEarnEnabled ?? config.isEarnEnabled,
        isSettlementEnabled: updateData.isSettlementEnabled ?? config.isSettlementEnabled,
        minSettlementAmount: updateData.minSettlementAmount ?? config.minSettlementAmount,
        maxDailyEarnPerUser: updateData.maxDailyEarnPerUser ?? config.maxDailyEarnPerUser,
        description: updateData.description ?? config.description,
        updatedAt: new Date(),
      });
    }

    // 4. Save
    return await this.compConfigRepository.save(config);
  }
}

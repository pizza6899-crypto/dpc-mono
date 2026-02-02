import { Injectable } from '@nestjs/common';
import { WageringConfig } from '../domain/wagering-config.entity';
import { WageringCurrencySetting } from '../domain/value-objects/wagering-currency-setting.vo';
import { Prisma } from '@prisma/client';
import type { WageringConfig as PrismaWageringConfig } from '@prisma/client';

@Injectable()
export class WageringConfigMapper {
    toDomain(prismaModel: PrismaWageringConfig): WageringConfig {
        const rawSettings = (prismaModel.currencySettings ?? {}) as Record<string, any>;
        const currencySettings: Record<string, WageringCurrencySetting> = {};

        for (const [currency, data] of Object.entries(rawSettings)) {
            currencySettings[currency] = WageringCurrencySetting.fromRaw(data);
        }

        return WageringConfig.fromPersistence({
            id: prismaModel.id,
            defaultBonusExpiryDays: prismaModel.defaultBonusExpiryDays,
            currencySettings,
            isWageringCheckEnabled: prismaModel.isWageringCheckEnabled,
            isAutoCancellationEnabled: prismaModel.isAutoCancellationEnabled,
            updatedAt: prismaModel.updatedAt,
            updatedBy: prismaModel.updatedBy,
        });
    }

    toPrisma(domain: WageringConfig): Prisma.WageringConfigUncheckedUpdateInput {
        const currencySettings: Record<string, any> = {};

        for (const [currency, setting] of Object.entries(domain.currencySettings)) {
            currencySettings[currency] = setting.toRaw();
        }

        return {
            id: domain.id,
            defaultBonusExpiryDays: domain.defaultBonusExpiryDays,
            currencySettings: currencySettings as Prisma.InputJsonValue,
            isWageringCheckEnabled: domain.isWageringCheckEnabled,
            isAutoCancellationEnabled: domain.isAutoCancellationEnabled,
            updatedBy: domain.updatedBy,
        };
    }
}

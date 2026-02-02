import { Injectable } from '@nestjs/common';
import { WageringConfig, CurrencySetting } from '../domain/wagering-config.entity';
import { WageringConfig as PrismaWageringConfig, Prisma } from '@prisma/client';

@Injectable()
export class WageringConfigMapper {
    toDomain(prismaModel: PrismaWageringConfig): WageringConfig {
        return WageringConfig.rehydrate({
            id: prismaModel.id,
            defaultBonusExpiryDays: prismaModel.defaultBonusExpiryDays,
            currencySettings: (prismaModel.currencySettings ?? {}) as unknown as Record<string, CurrencySetting>,
            isWageringCheckEnabled: prismaModel.isWageringCheckEnabled,
            isAutoCancellationEnabled: prismaModel.isAutoCancellationEnabled,
            updatedAt: prismaModel.updatedAt,
            updatedBy: prismaModel.updatedBy,
        });
    }

    toPrisma(domain: WageringConfig): Omit<PrismaWageringConfig, 'updatedAt'> {
        return {
            id: domain.id,
            defaultBonusExpiryDays: domain.defaultBonusExpiryDays,
            currencySettings: (domain.currencySettings ?? Prisma.JsonNull) as any,
            isWageringCheckEnabled: domain.isWageringCheckEnabled,
            isAutoCancellationEnabled: domain.isAutoCancellationEnabled,
            updatedBy: domain.updatedBy,
        };
    }
}

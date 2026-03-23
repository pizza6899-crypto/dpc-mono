import { Injectable } from '@nestjs/common';
import { GamificationConfig as PrismaGamificationConfig, Prisma } from '@prisma/client';
import { GamificationConfig } from '../domain/gamification-config.entity';

@Injectable()
export class GamificationConfigMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(prismaConfig: PrismaGamificationConfig): GamificationConfig {
    return GamificationConfig.rehydrate({
      expGrantMultiplierUsd: prismaConfig.expGrantMultiplierUsd,
      maxStatLimit: prismaConfig.maxStatLimit,
      statPointGrantPerLevel: prismaConfig.statPointGrantPerLevel,
      statResetCurrency: prismaConfig.statResetCurrency,
      statResetPrice: prismaConfig.statResetPrice,
      updatedAt: prismaConfig.updatedAt,
    });
  }

  /**
   * Domain -> Prisma Update/Create Input
   */
  toPrismaUpsert(config: GamificationConfig): Prisma.GamificationConfigUpdateInput & Prisma.GamificationConfigCreateInput {
    return {
      id: GamificationConfig.CONFIG_ID,
      expGrantMultiplierUsd: config.expGrantMultiplierUsd,
      maxStatLimit: config.maxStatLimit,
      statPointGrantPerLevel: config.statPointGrantPerLevel,
      statResetCurrency: config.statResetCurrency,
      statResetPrice: config.statResetPrice,
    };
  }
}

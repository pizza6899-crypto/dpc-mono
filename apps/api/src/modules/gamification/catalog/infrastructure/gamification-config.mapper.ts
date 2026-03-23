import { Injectable } from '@nestjs/common';
import { GamificationConfig as PrismaGamificationConfig, Prisma } from '@prisma/client';
import { GamificationConfig } from '../domain/gamification-config.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class GamificationConfigMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(prismaConfig: PersistenceOf<PrismaGamificationConfig>): GamificationConfig {
    return GamificationConfig.rehydrate({
      expGrantMultiplierUsd: Cast.decimal(prismaConfig.expGrantMultiplierUsd),
      maxStatLimit: prismaConfig.maxStatLimit,
      statPointGrantPerLevel: prismaConfig.statPointGrantPerLevel,
      statResetCurrency: prismaConfig.statResetCurrency,
      statResetPrice: Cast.decimal(prismaConfig.statResetPrice),
      updatedAt: Cast.date(prismaConfig.updatedAt),
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

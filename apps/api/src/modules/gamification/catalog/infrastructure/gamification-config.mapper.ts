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
      xpGrantMultiplierUsd: Cast.decimal(prismaConfig.xpGrantMultiplierUsd),
      maxStatLimit: prismaConfig.maxStatLimit,
      statPointsGrantPerLevel: prismaConfig.statPointsGrantPerLevel,
      statResetPrices: prismaConfig.statResetPrices,
      updatedAt: Cast.date(prismaConfig.updatedAt),
    });
  }

  /**
   * Domain -> Prisma Update/Create Input
   */
  toPrismaUpsert(config: GamificationConfig): Prisma.GamificationConfigUpdateInput & Prisma.GamificationConfigCreateInput {
    return {
      id: GamificationConfig.CONFIG_ID,
      xpGrantMultiplierUsd: config.xpGrantMultiplierUsd,
      maxStatLimit: config.maxStatLimit,
      statPointsGrantPerLevel: config.statPointsGrantPerLevel,
      statResetPrices: config.statResetPrices as Prisma.JsonObject,
    };
  }
}

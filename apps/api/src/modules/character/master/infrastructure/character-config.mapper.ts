import { Injectable } from '@nestjs/common';
import { CharacterConfig as PrismaCharacterConfig, Prisma } from '@prisma/client';
import { CharacterConfig } from '../domain/character-config.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class CharacterConfigMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(prismaConfig: PersistenceOf<PrismaCharacterConfig>): CharacterConfig {
    return CharacterConfig.rehydrate({
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
  toPrismaUpsert(config: CharacterConfig): Prisma.CharacterConfigUpdateInput & Prisma.CharacterConfigCreateInput {
    return {
      id: CharacterConfig.CONFIG_ID,
      xpGrantMultiplierUsd: config.xpGrantMultiplierUsd,
      maxStatLimit: config.maxStatLimit,
      statPointsGrantPerLevel: config.statPointsGrantPerLevel,
      statResetPrices: config.statResetPrices as Prisma.JsonObject,
    };
  }
}

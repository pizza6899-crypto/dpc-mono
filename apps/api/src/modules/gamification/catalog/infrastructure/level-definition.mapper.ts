import { Injectable } from '@nestjs/common';
import { LevelDefinition as PrismaLevelDefinition } from '@prisma/client';
import { LevelDefinition } from '../domain/level-definition.entity';

@Injectable()
export class LevelDefinitionMapper {
  /**
   * Prisma -> Domain
   */
  toDomain(prismaLevel: PrismaLevelDefinition): LevelDefinition {
    return LevelDefinition.rehydrate({
      level: prismaLevel.level,
      requiredXp: prismaLevel.requiredXp,
      statPointsBoost: prismaLevel.statPointsBoost,
      tierCode: prismaLevel.tierCode,
      tierImageUrl: prismaLevel.tierImageUrl,
      createdAt: prismaLevel.createdAt,
      updatedAt: prismaLevel.updatedAt,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { LevelDefinition as PrismaLevelDefinition, Prisma } from '@prisma/client';
import { LevelDefinition } from '../domain/level-definition.entity';
import { Cast, PersistenceOf } from 'src/infrastructure/persistence/persistence.util';

@Injectable()
export class LevelDefinitionMapper {
  /**
   * DB 또는 캐시에서 온 데이터를 도메인 엔티티로 변환합니다.
   */
  toDomain(data: PersistenceOf<PrismaLevelDefinition>): LevelDefinition {
    return LevelDefinition.rehydrate({
      level: data.level,
      requiredXp: Cast.decimal(data.requiredXp),
      tierCode: data.tierCode,
      tierImageUrl: data.tierImageUrl,
      statPointsBoost: data.statPointsBoost,
      updatedAt: Cast.date(data.updatedAt),
    });
  }

  /**
   * 도메인 엔티티를 Prisma Input으로 변환합니다 (Upsert용).
   */
  toPrisma(domain: LevelDefinition): Prisma.LevelDefinitionUpdateInput & Prisma.LevelDefinitionCreateInput {
    return {
      level: domain.level,
      requiredXp: domain.requiredXp,
      tierCode: domain.tierCode,
      tierImageUrl: domain.tierImageUrl,
      statPointsBoost: domain.statPointsBoost,
    };
  }
}

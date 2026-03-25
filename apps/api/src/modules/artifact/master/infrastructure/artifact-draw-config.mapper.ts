import { Injectable } from '@nestjs/common';
import { ArtifactDrawConfig as PrismaArtifactDrawConfig, Prisma } from '@prisma/client';
import { ArtifactDrawConfig } from '../domain/artifact-draw-config.entity';

@Injectable()
export class ArtifactDrawConfigMapper {
  toEntity(model: PrismaArtifactDrawConfig): ArtifactDrawConfig {
    return ArtifactDrawConfig.rehydrate({
      grade: model.grade,
      probability: new Prisma.Decimal(model.probability),
      updatedAt: new Date(model.updatedAt),
    });
  }
}

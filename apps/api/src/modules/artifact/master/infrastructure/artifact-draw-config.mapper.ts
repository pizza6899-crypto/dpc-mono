import { Injectable } from '@nestjs/common';
import { ArtifactDrawConfig as PrismaArtifactDrawConfig } from '@prisma/client';
import { ArtifactDrawConfig } from '../domain/artifact-draw-config.entity';

@Injectable()
export class ArtifactDrawConfigMapper {
  toEntity(model: PrismaArtifactDrawConfig): ArtifactDrawConfig {
    return ArtifactDrawConfig.rehydrate({
      grade: model.grade,
      probability: model.probability,
    });
  }
}

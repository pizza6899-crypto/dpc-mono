import { Injectable } from '@nestjs/common';
import { ArtifactCatalog as PrismaArtifactCatalog } from '@prisma/client';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';

@Injectable()
export class ArtifactCatalogMapper {
  toEntity(model: PrismaArtifactCatalog): ArtifactCatalog {
    return ArtifactCatalog.rehydrate({
      id: model.id,
      code: model.code,
      grade: model.grade,
      drawWeight: model.drawWeight,
      casinoBenefit: model.casinoBenefit,
      slotBenefit: model.slotBenefit,
      sportsBenefit: model.sportsBenefit,
      minigameBenefit: model.minigameBenefit,
      badBeatJackpot: model.badBeatJackpot,
      criticalJackpot: model.criticalJackpot,
      imageUrl: model.imageUrl,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    });
  }
}

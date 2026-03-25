import { Injectable } from '@nestjs/common';
import { ArtifactCatalog as PrismaArtifactCatalog } from '@prisma/client';
import { ArtifactCatalog } from '../domain/artifact-catalog.entity';

@Injectable()
export class ArtifactCatalogMapper {
  toEntity(model: PrismaArtifactCatalog): ArtifactCatalog {
    return ArtifactCatalog.rehydrate({
      id: BigInt(model.id),
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
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
    });
  }
}

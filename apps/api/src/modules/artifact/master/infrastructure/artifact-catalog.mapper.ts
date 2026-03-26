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
      status: model.status,
      casinoBenefit: model.casinoBenefit,
      slotBenefit: model.slotBenefit,
      sportsBenefit: model.sportsBenefit,
      minigameBenefit: model.minigameBenefit,
      badBeatBenefit: model.badBeatBenefit,
      criticalBenefit: model.criticalBenefit,
      imageUrl: model.imageUrl,
      createdAt: new Date(model.createdAt),
      updatedAt: new Date(model.updatedAt),
    });
  }
}

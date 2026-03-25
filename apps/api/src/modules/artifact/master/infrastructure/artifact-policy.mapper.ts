import { Injectable } from '@nestjs/common';
import { ArtifactPolicy as PrismaArtifactPolicy } from '@prisma/client';
import { ArtifactPolicy } from '../domain/artifact-policy.entity';

@Injectable()
export class ArtifactPolicyMapper {
  toEntity(model: PrismaArtifactPolicy): ArtifactPolicy {
    return ArtifactPolicy.rehydrate({
      id: model.id,
      drawPrices: model.drawPrices,
      synthesisConfigs: model.synthesisConfigs,
      slotUnlockConfigs: model.slotUnlockConfigs,
      updatedAt: model.updatedAt,
    });
  }
}

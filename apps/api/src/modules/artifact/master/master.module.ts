import { Module } from '@nestjs/common';
import { ArtifactCatalogRepositoryPort } from './ports/artifact-catalog.repository.port';
import { PrismaArtifactCatalogRepository } from './infrastructure/prisma-artifact-catalog.repository';
import { ArtifactPolicyRepositoryPort } from './ports/artifact-policy.repository.port';
import { PrismaArtifactPolicyRepository } from './infrastructure/prisma-artifact-policy.repository';
import { ArtifactDrawConfigRepositoryPort } from './ports/artifact-draw-config.repository.port';
import { PrismaArtifactDrawConfigRepository } from './infrastructure/prisma-artifact-draw-config.repository';
import { PickRandomArtifactService } from './application/pick-random-artifact.service';
import { ArtifactCatalogMapper } from './infrastructure/artifact-catalog.mapper';
import { ArtifactPolicyMapper } from './infrastructure/artifact-policy.mapper';
import { ArtifactDrawConfigMapper } from './infrastructure/artifact-draw-config.mapper';
import { ArtifactDrawConfigAdminController } from './controllers/admin/artifact-draw-config-admin.controller';

@Module({
  controllers: [ArtifactDrawConfigAdminController],
  providers: [
    ArtifactCatalogMapper,
    ArtifactPolicyMapper,
    ArtifactDrawConfigMapper,
    {
      provide: ArtifactCatalogRepositoryPort,
      useClass: PrismaArtifactCatalogRepository,
    },
    {
      provide: ArtifactPolicyRepositoryPort,
      useClass: PrismaArtifactPolicyRepository,
    },
    {
      provide: ArtifactDrawConfigRepositoryPort,
      useClass: PrismaArtifactDrawConfigRepository,
    },
    PickRandomArtifactService,
  ],
  exports: [
    ArtifactCatalogRepositoryPort,
    ArtifactPolicyRepositoryPort,
    ArtifactDrawConfigRepositoryPort,
    PickRandomArtifactService,
  ],
})
export class ArtifactMasterModule { }

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
import { ArtifactPolicyAdminController } from './controllers/admin/artifact-policy-admin.controller';
import { GetDrawConfigAdminService } from './application/get-draw-config-admin.service';
import { UpdateDrawConfigsAdminService } from './application/update-draw-configs-admin.service';
import { ArtifactDrawConfigPolicy } from './domain/artifact-draw-config.policy';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
  imports: [ConcurrencyModule],
  controllers: [
    ArtifactDrawConfigAdminController,
    ArtifactPolicyAdminController,
  ],
  providers: [
    ArtifactCatalogMapper,
    ArtifactPolicyMapper,
    ArtifactDrawConfigMapper,
    ArtifactDrawConfigPolicy,
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
    GetDrawConfigAdminService,
    UpdateDrawConfigsAdminService,
  ],
  exports: [
    ArtifactCatalogRepositoryPort,
    ArtifactPolicyRepositoryPort,
    ArtifactDrawConfigRepositoryPort,
    PickRandomArtifactService,
    GetDrawConfigAdminService,
    UpdateDrawConfigsAdminService,
  ],
})
export class ArtifactMasterModule { }

import { Module } from '@nestjs/common';
import { ArtifactCatalogRepositoryPort } from './ports/artifact-catalog.repository.port';
import { PrismaArtifactCatalogRepository } from './infrastructure/prisma-artifact-catalog.repository';
import { ArtifactPolicyRepositoryPort } from './ports/artifact-policy.repository.port';
import { PrismaArtifactPolicyRepository } from './infrastructure/prisma-artifact-policy.repository';
import { ArtifactDrawConfigRepositoryPort } from './ports/artifact-draw-config.repository.port';
import { PrismaArtifactDrawConfigRepository } from './infrastructure/prisma-artifact-draw-config.repository';
import { ArtifactCatalogMapper } from './infrastructure/artifact-catalog.mapper';
import { ArtifactPolicyMapper } from './infrastructure/artifact-policy.mapper';
import { ArtifactDrawConfigMapper } from './infrastructure/artifact-draw-config.mapper';
import { ArtifactCatalogAdminController } from './controllers/admin/artifact-catalog-admin.controller';
import { ArtifactPublicController } from './controllers/public/artifact-public.controller';
import { ArtifactDrawConfigAdminController } from './controllers/admin/artifact-draw-config-admin.controller';
import { ArtifactPolicyAdminController } from './controllers/admin/artifact-policy-admin.controller';
import { GetDrawConfigAdminService } from './application/get-draw-config-admin.service';
import { GetArtifactPolicyAdminService } from './application/get-artifact-policy-admin.service';
import { UpdateArtifactDrawPricesAdminService } from './application/update-artifact-draw-prices-admin.service';
import { UpdateArtifactSynthesisConfigsAdminService } from './application/update-artifact-synthesis-configs-admin.service';
import { UpdateDrawConfigsAdminService } from './application/update-draw-configs-admin.service';
import { ArtifactDrawConfigPolicy } from './domain/artifact-draw-config.policy';
import { ArtifactPolicyPolicy } from './domain/artifact-policy.policy';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { FileModule } from '../../file/file.module';
import { GetArtifactCatalogAdminService } from './application/get-artifact-catalog-admin.service';
import { CreateArtifactCatalogAdminService } from './application/create-artifact-catalog-admin.service';
import { UpdateArtifactCatalogAdminService } from './application/update-artifact-catalog-admin.service';

@Module({
  imports: [ConcurrencyModule, FileModule],
  controllers: [
    ArtifactPublicController,
    ArtifactCatalogAdminController,
    ArtifactDrawConfigAdminController,
    ArtifactPolicyAdminController,
  ],
  providers: [
    ArtifactCatalogMapper,
    ArtifactPolicyMapper,
    ArtifactDrawConfigMapper,
    ArtifactDrawConfigPolicy,
    ArtifactPolicyPolicy,
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
    GetDrawConfigAdminService,
    GetArtifactPolicyAdminService,
    UpdateArtifactDrawPricesAdminService,
    UpdateArtifactSynthesisConfigsAdminService,
    UpdateDrawConfigsAdminService,
    GetArtifactCatalogAdminService,
    CreateArtifactCatalogAdminService,
    UpdateArtifactCatalogAdminService,
  ],
  exports: [
    ArtifactCatalogRepositoryPort,
    ArtifactPolicyRepositoryPort,
    ArtifactDrawConfigRepositoryPort,
    GetDrawConfigAdminService,
    GetArtifactPolicyAdminService,
    UpdateArtifactDrawPricesAdminService,
    UpdateArtifactSynthesisConfigsAdminService,
    UpdateDrawConfigsAdminService,
    GetArtifactCatalogAdminService,
    CreateArtifactCatalogAdminService,
    ArtifactCatalogMapper,
  ],
})
export class ArtifactMasterModule { }

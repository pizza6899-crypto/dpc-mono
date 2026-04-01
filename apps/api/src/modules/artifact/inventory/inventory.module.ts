import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactStatusModule } from '../status/status.module'; // Status 모듈 리소스 참조
import { UserArtifactInventoryController } from './controllers/user/user-artifact-inventory.controller';
import { UserArtifactRepositoryPort } from './ports/user-artifact.repository.port';
import { PrismaUserArtifactRepository } from './infrastructure/prisma-user-artifact.repository';
import { ListMyArtifactsService } from './application/list-my-artifacts.service';
import { UserArtifactMapper } from './infrastructure/user-artifact.mapper';
import { ArtifactCatalogMapper } from '../master/infrastructure/artifact-catalog.mapper';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactStatusModule,
  ],
  controllers: [
    UserArtifactInventoryController,
  ],
  providers: [
    UserArtifactMapper,
    ArtifactCatalogMapper, // 명시적 주입 지원
    {
      provide: UserArtifactRepositoryPort,
      useClass: PrismaUserArtifactRepository,
    },
    ListMyArtifactsService,
  ],
  exports: [
    UserArtifactRepositoryPort,
    ListMyArtifactsService,
  ],
})
export class ArtifactInventoryModule { }

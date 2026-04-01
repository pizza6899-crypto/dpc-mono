import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactStatusModule } from '../status/status.module'; // Status 모듈 리소스 참조
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { UserArtifactInventoryController } from './controllers/user/user-artifact-inventory.controller';
import { UserArtifactRepositoryPort } from './ports/user-artifact.repository.port';
import { PrismaUserArtifactRepository } from './infrastructure/prisma-user-artifact.repository';
import { ListMyArtifactsService } from './application/list-my-artifacts.service';
import { EquipArtifactService } from './application/equip-artifact.service';
import { UnequipArtifactService } from './application/unequip-artifact.service';
import { UserArtifactMapper } from './infrastructure/user-artifact.mapper';
import { ArtifactCatalogMapper } from '../master/infrastructure/artifact-catalog.mapper';

import { CharacterStatusModule } from 'src/modules/character/status/status.module';
import { GetEquippedArtifactStatsService } from './application/get-equipped-artifact-stats.service';

@Module({
  imports: [
    ArtifactMasterModule,
    ArtifactStatusModule,
    ConcurrencyModule,
    CharacterStatusModule,
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
    EquipArtifactService,
    UnequipArtifactService,
    GetEquippedArtifactStatsService,
  ],
  exports: [
    UserArtifactRepositoryPort,
    ListMyArtifactsService,
    EquipArtifactService,
    UnequipArtifactService,
    GetEquippedArtifactStatsService,
  ],
})
export class ArtifactInventoryModule { }

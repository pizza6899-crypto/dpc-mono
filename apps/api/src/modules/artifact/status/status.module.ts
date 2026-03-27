import { Module } from '@nestjs/common';
import { UserArtifactStatusRepositoryPort } from './ports/user-artifact-status.repository.port';
import { PrismaUserArtifactStatusRepository } from './infrastructure/prisma-user-artifact-status.repository';
import { UserArtifactPityRepositoryPort } from './ports/user-artifact-pity.repository.port';
import { PrismaUserArtifactPityRepository } from './infrastructure/prisma-user-artifact-pity.repository';
import { UserArtifactStatusMapper } from './infrastructure/user-artifact-status.mapper';
import { UserArtifactPityMapper } from './infrastructure/user-artifact-pity.mapper';
import { InitializeUserArtifactStatusService } from './application/initialize-user-artifact-status.service';
import { InitializeUserArtifactPityService } from './application/initialize-user-artifact-pity.service';
import { SyncArtifactSlotService } from './application/sync-artifact-slot.service';
import { ArtifactMasterModule } from '../master/master.module';
import { CharacterStatusModule } from 'src/modules/character/status/status.module';

@Module({
  imports: [
    ArtifactMasterModule,
    CharacterStatusModule,
  ],
  controllers: [],
  providers: [
    UserArtifactStatusMapper,
    UserArtifactPityMapper,
    InitializeUserArtifactStatusService,
    InitializeUserArtifactPityService,
    SyncArtifactSlotService,
    {
      provide: UserArtifactStatusRepositoryPort,
      useClass: PrismaUserArtifactStatusRepository,
    },
    {
      provide: UserArtifactPityRepositoryPort,
      useClass: PrismaUserArtifactPityRepository,
    },
  ],
  exports: [
    UserArtifactStatusRepositoryPort,
    UserArtifactPityRepositoryPort,
    InitializeUserArtifactStatusService,
    InitializeUserArtifactPityService,
    SyncArtifactSlotService,
  ],
})
export class ArtifactStatusModule { }

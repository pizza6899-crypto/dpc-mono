import { Module } from '@nestjs/common';
import { UserArtifactStatusRepositoryPort } from './ports/user-artifact-status.repository.port';
import { PrismaUserArtifactStatusRepository } from './infrastructure/prisma-user-artifact-status.repository';
import { UserArtifactStatusMapper } from './infrastructure/user-artifact-status.mapper';
import { SyncArtifactSlotService } from './application/sync-artifact-slot.service';
import { GetUserArtifactStatusService } from './application/get-user-artifact-status.service';
import { InitializeUserArtifactStatusService } from './application/initialize-user-artifact-status.service';
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
    GetUserArtifactStatusService,
    InitializeUserArtifactStatusService,
    SyncArtifactSlotService,
    {
      provide: UserArtifactStatusRepositoryPort,
      useClass: PrismaUserArtifactStatusRepository,
    },
  ],
  exports: [
    UserArtifactStatusRepositoryPort,
    GetUserArtifactStatusService,
    InitializeUserArtifactStatusService,
    SyncArtifactSlotService,
  ],
})
export class ArtifactStatusModule { }

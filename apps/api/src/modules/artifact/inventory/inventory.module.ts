import { Module } from '@nestjs/common';
import { ArtifactMasterModule } from '../master/master.module';
import { ArtifactStatusModule } from '../status/status.module'; // Status 모듈 리소스 참조
import { UserArtifactInventoryController } from './controllers/user/user-artifact-inventory.controller';
import { UserArtifactRepositoryPort } from './ports/user-artifact.repository.port';
import { PrismaUserArtifactRepository } from './infrastructure/prisma-user-artifact.repository';
import { UserArtifactMapper } from './infrastructure/user-artifact.mapper';

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
    {
      provide: UserArtifactRepositoryPort,
      useClass: PrismaUserArtifactRepository,
    },
  ],
  exports: [
    UserArtifactRepositoryPort,
  ],
})
export class ArtifactInventoryModule { }

import { Module } from '@nestjs/common';
import { UserArtifactStatusRepositoryPort } from './ports/user-artifact-status.repository.port';
import { PrismaUserArtifactStatusRepository } from './infrastructure/prisma-user-artifact-status.repository';
import { UserArtifactPityRepositoryPort } from './ports/user-artifact-pity.repository.port';
import { PrismaUserArtifactPityRepository } from './infrastructure/prisma-user-artifact-pity.repository';
import { UserArtifactStatusMapper } from './infrastructure/user-artifact-status.mapper';
import { UserArtifactPityMapper } from './infrastructure/user-artifact-pity.mapper';

@Module({
  imports: [],
  controllers: [],
  providers: [
    UserArtifactStatusMapper,
    UserArtifactPityMapper,
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
  ],
})
export class ArtifactStatusModule { }

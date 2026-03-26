import { Module } from '@nestjs/common';
import { CreateUserArtifactLogService } from './application/create-user-artifact-log.service';
import { CreateArtifactBonusPoolLogService } from './application/create-artifact-bonus-pool-log.service';
import { GetUserArtifactLogAdminService } from './application/admin/get-user-artifact-log-admin.service';
import { GetArtifactBonusPoolLogAdminService } from './application/admin/get-artifact-bonus-pool-log-admin.service';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { UserArtifactLogRepositoryPort } from './ports/user-artifact-log.repository.port';
import { PrismaUserArtifactLogRepository } from './infrastructure/prisma-user-artifact-log.repository';
import { ArtifactBonusPoolLogRepositoryPort } from './ports/artifact-bonus-pool-log.repository.port';
import { PrismaArtifactBonusPoolLogRepository } from './infrastructure/prisma-artifact-bonus-pool-log.repository';
import { UserArtifactLogMapper } from './infrastructure/user-artifact-log.mapper';
import { ArtifactBonusPoolLogMapper } from './infrastructure/artifact-bonus-pool-log.mapper';
import { ArtifactAuditAdminController } from './controllers/admin/artifact-audit-admin.controller';

@Module({
  imports: [
    SnowflakeModule,
  ],
  controllers: [
    ArtifactAuditAdminController,
  ],
  providers: [
    CreateUserArtifactLogService,
    CreateArtifactBonusPoolLogService,
    GetUserArtifactLogAdminService,
    GetArtifactBonusPoolLogAdminService,
    UserArtifactLogMapper,
    ArtifactBonusPoolLogMapper,
    {
      provide: UserArtifactLogRepositoryPort,
      useClass: PrismaUserArtifactLogRepository,
    },
    {
      provide: ArtifactBonusPoolLogRepositoryPort,
      useClass: PrismaArtifactBonusPoolLogRepository,
    },
  ],
  exports: [
    CreateUserArtifactLogService,
    CreateArtifactBonusPoolLogService,
  ],
})
export class ArtifactAuditModule { }

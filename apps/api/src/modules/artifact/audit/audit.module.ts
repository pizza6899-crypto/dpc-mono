import { Module } from '@nestjs/common';
import { CreateUserArtifactLogService } from './application/create-user-artifact-log.service';
import { GetUserArtifactLogAdminService } from './application/get-user-artifact-log-admin.service';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { UserArtifactLogRepositoryPort } from './ports/user-artifact-log.repository.port';
import { PrismaUserArtifactLogRepository } from './infrastructure/prisma-user-artifact-log.repository';
import { UserArtifactLogMapper } from './infrastructure/user-artifact-log.mapper';
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
    GetUserArtifactLogAdminService,
    UserArtifactLogMapper,
    {
      provide: UserArtifactLogRepositoryPort,
      useClass: PrismaUserArtifactLogRepository,
    },
  ],
  exports: [
    CreateUserArtifactLogService,
  ],
})
export class ArtifactAuditModule { }

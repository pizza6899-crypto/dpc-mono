import { Global, Module } from '@nestjs/common';
import { UNIVERSAL_LOG_REPOSITORY_PORT } from './ports/universal-log.repository.port';
import { PrismaUniversalLogRepository } from './infrastructure/prisma-universal-log.repository';
import { USER_AGENT_CATALOG_REPOSITORY_PORT } from './ports/user-agent-catalog.repository.port';
import { PrismaUserAgentCatalogRepository } from './infrastructure/prisma-user-agent-catalog.repository';
import { CreateUniversalLogService } from './application/create-universal-log.service';
import { SnowflakeModule } from '../../common/snowflake/snowflake.module';

@Global()
@Module({
  imports: [SnowflakeModule],
  providers: [
    {
      provide: UNIVERSAL_LOG_REPOSITORY_PORT,
      useClass: PrismaUniversalLogRepository,
    },
    {
      provide: USER_AGENT_CATALOG_REPOSITORY_PORT,
      useClass: PrismaUserAgentCatalogRepository,
    },
    CreateUniversalLogService,
  ],
  exports: [
    UNIVERSAL_LOG_REPOSITORY_PORT,
    USER_AGENT_CATALOG_REPOSITORY_PORT,
    CreateUniversalLogService,
  ],
})
export class UniversalLogModule { }

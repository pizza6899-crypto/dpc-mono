import { Global, Module } from '@nestjs/common';
import { CreateUniversalLogService } from './application/create-universal-log.service';
import { UNIVERSAL_LOG_REPOSITORY_PORT } from './ports/universal-log.repository.port';
import { PrismaUniversalLogRepository } from './infrastructure/prisma-universal-log.repository';
import { USER_AGENT_CATALOG_REPOSITORY_PORT } from './ports/user-agent-catalog.repository.port';
import { PrismaUserAgentCatalogRepository } from './infrastructure/prisma-user-agent-catalog.repository';
import { SnowflakeModule } from '../../common/snowflake/snowflake.module';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { BullModule } from '@nestjs/bullmq';
import { UNIVERSAL_LOG_QUEUES } from './infrastructure/universal-log.bullmq';
import { UniversalLogProcessor } from './infrastructure/universal-log.processor';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { CacheModule } from 'src/common/cache/cache.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    CacheModule,
    SnowflakeModule,
    RedisModule,
    BullMqModule,
    BullModule.registerQueue(UNIVERSAL_LOG_QUEUES.SCHEDULER),
  ],
  providers: [
    CreateUniversalLogService,
    UniversalLogProcessor,
    {
      provide: UNIVERSAL_LOG_REPOSITORY_PORT,
      useClass: PrismaUniversalLogRepository,
    },
    {
      provide: USER_AGENT_CATALOG_REPOSITORY_PORT,
      useClass: PrismaUserAgentCatalogRepository,
    },
  ],
  exports: [CreateUniversalLogService],
})
export class UniversalLogModule {}

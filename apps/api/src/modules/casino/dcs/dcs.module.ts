import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { DcsMapperService } from './infrastructure/dcs-mapper.service';
import { DcsApiService } from './infrastructure/dcs-api.service';
import { DcsTestController } from './controllers/dcs-test.controller';
import { DcsCallbackController } from './controllers/dcs-callback.controller';
import { DcsCallbackService } from './application/dcs-callback.service';
import { DcsGameService } from './application/dcs-game.service';
import { CasinoModule } from '../casino.module';
import { DcsApiLoggingInterceptor } from './infrastructure/dcs-api-logging.interceptor';
import { DcsLoggingInterceptor } from './infrastructure/dcs-logging.interceptor';
import { DcsGameRefreshService } from './application/dcs-game-refresh.service';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { DcsFetchGameReplayUrlProcessor } from './processors/dcs-fetch-game-replay-url.processor';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    EnvModule,
    ConcurrencyModule,
    RedisModule,
    forwardRef(() => CasinoModule),
    QueueModule,
  ],
  controllers: [DcsTestController, DcsCallbackController],
  providers: [
    DcsMapperService,
    DcsApiService,
    DcsCallbackService,
    DcsGameService,
    DcsGameRefreshService,
    DcsApiLoggingInterceptor,
    DcsLoggingInterceptor,
    DcsMapperService,
    DcsFetchGameReplayUrlProcessor,
  ],
  exports: [DcsGameService, DcsMapperService],
})
export class DcsModule {}

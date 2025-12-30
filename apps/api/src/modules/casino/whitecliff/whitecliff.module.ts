import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhitecliffCallbackService } from './application/whitecliff-callback.service';
import { WhitecliffApiService } from './infrastructure/whitecliff-api.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { WhitecliffCallbackController } from './controllers/whitecliff-callback.controller';
import { WhitecliffGameService } from './application/whitecliff-game.service';
import { WhitecliffAdminController } from './controllers/whitecliff-admin.controller';
import { WhitecliffLoggingInterceptor } from './infrastructure/whitecliff-logging.interceptor';
import { WhitecliffApiLoggingInterceptor } from './infrastructure/whitecliff-api-logging.interceptor';
import { WhitecliffGameRefreshService } from './application/whitecliff-game-refresh.service';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { WhitecliffMapperService } from './infrastructure/whitecliff-mapper.service';
import { CasinoModule } from '../casino.module';
import { WhitecliffTestController } from './controllers/whitecliff-test.controller';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { WhitecliffFetchGameResultUrlProcessor } from './processors/whitecliff-game-end-transaction-url.processor';
import { ExchangeModule } from 'src/modules/exchange/exchange.module';
import { WhitecliffPushedBetHistoryScheduler } from './schedulers/whitecliff-pushed-bet-history.scheduler';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
    EnvModule,
    ConcurrencyModule,
    RedisModule,
    forwardRef(() => CasinoModule),
    QueueModule,
    ExchangeModule,
  ],
  controllers: [
    WhitecliffCallbackController,
    WhitecliffAdminController,
    WhitecliffTestController,
  ],
  providers: [
    WhitecliffCallbackService,
    WhitecliffApiService,
    WhitecliffGameService,
    WhitecliffLoggingInterceptor,
    WhitecliffApiLoggingInterceptor,
    WhitecliffGameRefreshService,
    WhitecliffMapperService,
    WhitecliffFetchGameResultUrlProcessor,
    WhitecliffPushedBetHistoryScheduler,
  ],
  exports: [
    WhitecliffCallbackService,
    WhitecliffApiService,
    WhitecliffGameService,
    WhitecliffGameRefreshService,
    WhitecliffMapperService,
  ],
})
export class WhitecliffModule {}

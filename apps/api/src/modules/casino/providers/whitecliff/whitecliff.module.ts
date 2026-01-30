import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhitecliffCallbackService } from './application/whitecliff-callback.service';
import { WhitecliffApiService } from './infrastructure/whitecliff-api.service';
import { EnvModule } from 'src/common/env/env.module';
import { WhitecliffCallbackController } from './controllers/whitecliff-callback.controller';
import { WhitecliffGameService } from './application/whitecliff-game.service';
import { WhitecliffFetchGameResultService } from './application/whitecliff-fetch-game-result.service';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { WhitecliffMapperService } from './infrastructure/whitecliff-mapper.service';
import { ExchangeModule } from 'src/modules/exchange/exchange.module';
import { WhitecliffPushedBetHistoryProcessor } from './infrastructure/processors/whitecliff-pushed-bet-history.processor';
import { BullModule } from '@nestjs/bullmq';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { CasinoModule } from '../../casino.module';
import { WhitecliffExceptionFilter } from './infrastructure/whitecliff-exception.filter';

@Module({
  imports: [
    HttpModule,
    EnvModule,
    RedisModule,
    forwardRef(() => CasinoModule),
    ExchangeModule,
    AuditLogModule,
    WalletModule,
    BullModule.registerQueue({
      name: BULLMQ_QUEUES.CASINO.WHITECLIFF_HISTORY.name,
    }),
  ],
  controllers: [
    WhitecliffCallbackController,
  ],
  providers: [
    WhitecliffCallbackService,
    WhitecliffApiService,
    WhitecliffGameService,
    WhitecliffMapperService,
    WhitecliffFetchGameResultService,
    WhitecliffPushedBetHistoryProcessor,
    WhitecliffExceptionFilter,
  ],
  exports: [
    WhitecliffCallbackService,
    WhitecliffApiService,
    WhitecliffGameService,
    WhitecliffMapperService,
    WhitecliffFetchGameResultService,
  ],
})
export class WhitecliffModule { }

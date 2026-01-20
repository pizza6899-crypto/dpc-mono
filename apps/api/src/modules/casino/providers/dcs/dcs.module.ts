import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from 'src/common/env/env.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { DcsMapperService } from './infrastructure/dcs-mapper.service';
import { DcsApiService } from './infrastructure/dcs-api.service';
import { DcsTestController } from './controllers/dcs-test.controller';
import { DcsCallbackController } from './controllers/dcs-callback.controller';
import { DcsCallbackService } from './application/dcs-callback.service';
import { DcsGameService } from './application/dcs-game.service';
import { DcsFetchGameReplayUrlProcessor } from './processors/dcs-fetch-game-replay-url.processor';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { CasinoModule } from '../../casino.module';

@Module({
  imports: [
    HttpModule,
    EnvModule,
    ConcurrencyModule,
    RedisModule,
    forwardRef(() => CasinoModule),
    AuditLogModule,
    WalletModule,
  ],
  controllers: [DcsTestController, DcsCallbackController],
  providers: [
    DcsMapperService,
    DcsApiService,
    DcsCallbackService,
    DcsGameService,
    DcsMapperService,
    DcsFetchGameReplayUrlProcessor,
  ],
  exports: [DcsGameService, DcsMapperService],
})
export class DcsModule { }

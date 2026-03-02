import { forwardRef, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from 'src/common/env/env.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { DcsMapperService } from './infrastructure/dcs-mapper.service';
import { DcsApiService } from './infrastructure/dcs-api.service';
import { DcsCallbackController } from './controllers/dcs-callback.controller';
import { DcsCallbackService } from './application/dcs-callback.service';
import { DcsGameService } from './application/dcs-game.service';
import { DcsFetchGameResultService } from './application/dcs-fetch-game-result.service';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { CasinoModule } from '../../casino.module';
import { CasinoSessionModule } from '../../../casino-session/game-session.module';
import { TierProfileModule } from 'src/modules/tier/profile/tier-profile.module';
import { DcsExceptionFilter } from './infrastructure/dcs-exception.filter';

@Module({
  imports: [
    HttpModule,
    EnvModule,
    ConcurrencyModule,
    RedisModule,
    forwardRef(() => CasinoModule),
    CasinoSessionModule,
    TierProfileModule,
    AuditLogModule,
    WalletModule,
  ],
  controllers: [DcsCallbackController],
  providers: [
    DcsMapperService,
    DcsApiService,
    DcsCallbackService,
    DcsGameService,
    DcsFetchGameResultService,
    DcsExceptionFilter,
  ],
  exports: [
    DcsGameService,
    DcsMapperService,
    DcsFetchGameResultService,
    DcsApiService,
  ],
})
export class DcsModule { }

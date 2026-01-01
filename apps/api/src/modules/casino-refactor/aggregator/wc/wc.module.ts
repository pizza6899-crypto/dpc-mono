// src/modules/casino-refactor/aggregator/wc/wc.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhitecliffModule } from 'src/modules/casino/whitecliff/whitecliff.module';
import { WcCallbackService } from './application/wc-callback.service';
import { WcCallbackController } from './controllers/user/wc-callback.controller';
import { WcApiService } from './infrastructure/wc-api.service';
import { WC_API_PORT } from './ports/out/wc-api.token';
import { WcGameMapper } from './infrastructure/wc-game.mapper';
import { SyncGamesFromWcService } from './application/sync-games-from-wc.service';

@Module({
  imports: [HttpModule, WhitecliffModule, ],
  providers: [
    WcCallbackService,
    WcGameMapper,
    SyncGamesFromWcService,
    {
      provide: WC_API_PORT,
      useClass: WcApiService,
    },
  ],
  controllers: [WcCallbackController],
  exports: [WcCallbackService, WC_API_PORT, SyncGamesFromWcService],
})
export class WcModule {}


import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/platform/prisma/prisma.module';
import { WhitecliffModule } from './whitecliff/whitecliff.module';
import { DcsModule } from './dcs/dcs.module';
import { CasinoBalanceService } from './application/casino-balance.service';
import { CasinoGameController } from './controllers/casino-game.controller';
import { CasinoGameService } from './application/casino-game.service';
import { ActivityLogAdapter } from 'src/platform/activity-log/activity-log.adapter';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { CasinoBetService } from './application/casino-bet.service';
import { ConcurrencyModule } from 'src/platform/concurrency/concurrency.module';
import { VipModule } from '../vip/vip.module';
import { CompModule } from '../comp/comp.module';
import { CasinoBonusService } from './application/casino-bonus.service';
import { QueueModule } from 'src/platform/queue/queue.module';
import { RollingModule } from '../rolling/rolling.module';
import { GamePostProcessProcessor } from './processors/game-post-process.processor';
import { EnvModule } from 'src/platform/env/env.module';
import { CasinoRefundService } from './application/casino-refund.service';
import { ExchangeModule } from '../exchange/exchange.module';
import { GameSessionService } from './application/game-session.service';
import { UserStatsModule } from '../user-stats/user-stats.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => WhitecliffModule),
    forwardRef(() => DcsModule),
    ConcurrencyModule,
    VipModule,
    CompModule,
    QueueModule,
    RollingModule,
    EnvModule,
    ExchangeModule,
    UserStatsModule,
  ],
  controllers: [CasinoGameController],
  providers: [
    CasinoBalanceService,
    CasinoGameService,
    {
      provide: ACTIVITY_LOG,
      useClass: ActivityLogAdapter,
    },
    CasinoBetService,
    CasinoBonusService,
    CasinoRefundService,
    GamePostProcessProcessor,
    GameSessionService,
  ],
  exports: [
    CasinoBalanceService,
    CasinoBetService,
    CasinoBonusService,
    CasinoRefundService,
    GameSessionService,
  ],
})
export class CasinoModule {}

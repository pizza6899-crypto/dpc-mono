import { forwardRef, Module } from '@nestjs/common';
import { WhitecliffModule } from './whitecliff/whitecliff.module';
import { DcsModule } from './dcs/dcs.module';
import { CasinoGameUserController } from './controllers/user/casino-game-user.controller';
import { CasinoGameService } from './application/casino-game.service';
import { CasinoBetService } from './application/casino-bet.service';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { CasinoBonusService } from './application/casino-bonus.service';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { GamePostProcessProcessor } from './processors/game-post-process.processor';
import { EnvModule } from 'src/common/env/env.module';
import { CasinoRefundService } from './application/casino-refund.service';
import { ExchangeModule } from '../exchange/exchange.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { WalletModule } from '../wallet/wallet.module';
import { CasinoGameSessionMapper } from './infrastructure/mapper/casino-game-session.mapper';
import { CasinoGameSessionRepository } from './infrastructure/repository/casino-game-session.repository';
import { CASINO_GAME_SESSION_REPOSITORY } from './ports/out/casino-game-session.repository.token';
import { CreateCasinoGameSessionService } from './application/create-casino-game-session.service';
import { FindCasinoGameSessionService } from './application/find-casino-game-session.service';
import { WageringModule } from '../wagering/wagering.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TierModule } from '../tier/tier.module';
import { CompModule } from '../comp/comp.module';

@Module({
  imports: [
    forwardRef(() => WhitecliffModule),
    forwardRef(() => DcsModule),
    ConcurrencyModule,
    QueueModule,
    EnvModule,
    ExchangeModule,
    UserStatsModule,
    AuditLogModule,
    WalletModule,
    WageringModule,
    AnalyticsModule,
    TierModule,
    CompModule,
  ],
  controllers: [CasinoGameUserController],
  providers: [
    CasinoGameService,
    CasinoBetService,
    CasinoBonusService,
    CasinoRefundService,
    GamePostProcessProcessor,
    CasinoGameSessionMapper,
    {
      provide: CASINO_GAME_SESSION_REPOSITORY,
      useClass: CasinoGameSessionRepository,
    },
    CreateCasinoGameSessionService,
    FindCasinoGameSessionService,
  ],
  exports: [
    CasinoBetService,
    CasinoBonusService,
    CasinoRefundService,
    CreateCasinoGameSessionService,
    FindCasinoGameSessionService,
  ],
})
export class CasinoModule { }

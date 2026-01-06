import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { WhitecliffModule } from './whitecliff/whitecliff.module';
import { DcsModule } from './dcs/dcs.module';
import { CasinoBalanceService } from './application/casino-balance.service';
import { CasinoGameUserController } from './controllers/user/casino-game-user.controller';
import { CasinoGameService } from './application/casino-game.service';
import { CasinoBetService } from './application/casino-bet.service';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { CompModule } from '../comp/comp.module';
import { CasinoBonusService } from './application/casino-bonus.service';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { RollingModule } from '../rolling/rolling.module';
import { GamePostProcessProcessor } from './processors/game-post-process.processor';
import { EnvModule } from 'src/common/env/env.module';
import { CasinoRefundService } from './application/casino-refund.service';
import { ExchangeModule } from '../exchange/exchange.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { CasinoGameSessionMapper } from './infrastructure/mapper/casino-game-session.mapper';
import { CasinoGameSessionRepository } from './infrastructure/repository/casino-game-session.repository';
import { CASINO_GAME_SESSION_REPOSITORY } from './ports/out/casino-game-session.repository.token';
import { CreateCasinoGameSessionService } from './application/create-casino-game-session.service';
import { FindCasinoGameSessionService } from './application/find-casino-game-session.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => WhitecliffModule),
    forwardRef(() => DcsModule),
    ConcurrencyModule,
    CompModule,
    QueueModule,
    RollingModule,
    EnvModule,
    ExchangeModule,
    UserStatsModule,
    AuditLogModule,
  ],
  controllers: [CasinoGameUserController],
  providers: [
    CasinoBalanceService,
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
    CasinoBalanceService,
    CasinoBetService,
    CasinoBonusService,
    CasinoRefundService,
    CreateCasinoGameSessionService,
    FindCasinoGameSessionService,
  ],
})
export class CasinoModule { }

import { forwardRef, Module } from '@nestjs/common';
import { AggregatorModule } from './aggregator/aggregator.module';
import { GameCatalogModule } from './game-catalog/game-catalog.module';
import { GameSessionModule } from './game-session/game-session.module';
import { WhitecliffModule } from './providers/whitecliff/whitecliff.module';
import { DcsModule } from './providers/dcs/dcs.module';
import { CasinoBetService } from './application/casino-bet.service';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { CasinoBonusService } from './application/casino-bonus.service';
import { BullModule } from '@nestjs/bullmq';
import { CasinoQueueNames } from './infrastructure/queue/casino-queue.types';
import { CasinoQueueService } from './infrastructure/queue/casino-queue.service';
import { GamePostProcessProcessor } from './processors/game-post-process.processor';
import { EnvModule } from 'src/common/env/env.module';
import { CasinoRefundService } from './application/casino-refund.service';
import { ExchangeModule } from '../exchange/exchange.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { WalletModule } from '../wallet/wallet.module';
import { WageringModule } from '../wagering/wagering.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TierModule } from '../tier/tier.module';
import { CompModule } from '../comp/comp.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { LaunchGameService } from './application/launch-game.service';
import { GameRoundMapper } from './infrastructure/game-round.mapper';
import { GameTransactionMapper } from './infrastructure/game-transaction.mapper';
import { PrismaGameRoundRepository } from './infrastructure/prisma-game-round.repository';
import { PrismaGameTransactionRepository } from './infrastructure/prisma-game-transaction.repository';
import { GAME_ROUND_REPOSITORY_TOKEN } from './ports/out/game-round.repository.token';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from './ports/out/game-transaction.repository.token';
import { CasinoGameV2Service } from './application/service/casino-game-v2.service';

@Module({
  imports: [
    AggregatorModule,
    GameCatalogModule,
    GameSessionModule,
    forwardRef(() => WhitecliffModule),
    forwardRef(() => DcsModule),
    ConcurrencyModule,
    BullModule.registerQueue({
      name: CasinoQueueNames.WHITECLIFF_FETCH_GAME_RESULT_URL,
    }),
    BullModule.registerQueue({
      name: CasinoQueueNames.DCS_FETCH_GAME_REPLAY_URL,
    }),
    BullModule.registerQueue({
      name: CasinoQueueNames.GAME_POST_PROCESS,
    }),
    EnvModule,
    ExchangeModule,
    AuditLogModule,
    WalletModule,
    WageringModule,
    AnalyticsModule,
    TierModule,
    CompModule,
    SnowflakeModule,
  ],
  controllers: [],
  providers: [
    CasinoBetService,
    CasinoBonusService,
    CasinoRefundService,
    GamePostProcessProcessor,
    LaunchGameService,
    CasinoQueueService,
    GameRoundMapper,
    GameTransactionMapper,
    {
      provide: GAME_ROUND_REPOSITORY_TOKEN,
      useClass: PrismaGameRoundRepository,
    },
    {
      provide: GAME_TRANSACTION_REPOSITORY_TOKEN,
      useClass: PrismaGameTransactionRepository,
    },
    CasinoGameV2Service,
  ],
  exports: [
    CasinoBetService,
    CasinoBonusService,
    CasinoRefundService,
    GameSessionModule,
    LaunchGameService,
    CasinoQueueService,
    CasinoGameV2Service,
  ],
})
export class CasinoModule { }

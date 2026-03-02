import { forwardRef, Module } from '@nestjs/common';
import { AggregatorModule } from './aggregator/aggregator.module';
import { GameCatalogModule } from './game-catalog/game-catalog.module';
import { CasinoSessionModule } from '../casino-session/game-session.module';
import { WhitecliffModule } from './providers/whitecliff/whitecliff.module';
import { DcsModule } from './providers/dcs/dcs.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { BullModule } from '@nestjs/bullmq';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { CasinoQueueNames } from './infrastructure/queue/casino-queue.types';
import { GamePostProcessProcessor } from './infrastructure/queue/processors/game-post-process.processor';
import { GameResultFetchProcessor } from './infrastructure/queue/processors/game-result-fetch.processor';
import { EnvModule } from 'src/common/env/env.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { WalletModule } from '../wallet/wallet.module';
import { WageringModule } from '../wagering/wagering.module';
import { CompModule } from '../comp/comp.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { LaunchGameService } from './application/launch-game.service';
import { CasinoLaunchPolicy } from './domain/casino-launch.policy';
import { GameRoundMapper } from './infrastructure/game-round.mapper';
import { GameTransactionMapper } from './infrastructure/game-transaction.mapper';
import { GameRoundRepository } from './infrastructure/game-round.repository';
import { GameTransactionRepository } from './infrastructure/game-transaction.repository';
import { GAME_ROUND_REPOSITORY_TOKEN } from './ports/out/game-round.repository.token';
import { GAME_TRANSACTION_REPOSITORY_TOKEN } from './ports/out/game-transaction.repository.token';
import { CheckCasinoBalanceService } from './application/check-casino-balance.service';
import { ProcessCasinoBetService } from './application/process-casino-bet.service';
import { ProcessCasinoCreditService } from './application/process-casino-credit.service';
import { UpdatePushedBetService } from './application/update-pushed-bet.service';
import { CasinoGamePostProcessService } from './application/casino-game-post-process.service';
import { CasinoSimulatorController } from './dev-simulator/casino-simulator.controller';
import { CasinoSimulatorService } from './dev-simulator/casino-simulator.service';
import { TierEvaluatorModule } from '../tier/evaluator/tier-evaluator.module';

@Module({
  imports: [
    AggregatorModule,
    GameCatalogModule,
    CasinoSessionModule,
    forwardRef(() => WhitecliffModule),
    forwardRef(() => DcsModule),
    ConcurrencyModule,
    BullMqModule,
    BullModule.registerQueue({
      name: CasinoQueueNames.GAME_POST_PROCESS,
    }),
    BullModule.registerQueue({
      name: CasinoQueueNames.GAME_RESULT_FETCH,
    }),
    EnvModule,
    ExchangeModule,
    AuditLogModule,
    WalletModule,
    WageringModule,
    CompModule,
    SnowflakeModule,
    TierEvaluatorModule,
  ],
  controllers: [
    CasinoSimulatorController, // [DEV] Simulator
  ],
  providers: [
    GamePostProcessProcessor,
    GameResultFetchProcessor,
    LaunchGameService,
    CasinoLaunchPolicy,
    GameRoundMapper,
    GameTransactionMapper,
    {
      provide: GAME_ROUND_REPOSITORY_TOKEN,
      useClass: GameRoundRepository,
    },
    {
      provide: GAME_TRANSACTION_REPOSITORY_TOKEN,
      useClass: GameTransactionRepository,
    },
    CheckCasinoBalanceService,
    ProcessCasinoBetService,
    ProcessCasinoCreditService,
    UpdatePushedBetService,
    CasinoGamePostProcessService,
    CasinoSimulatorService, // [DEV] Simulator
  ],
  exports: [
    CasinoSessionModule,
    LaunchGameService,
    CheckCasinoBalanceService,
    ProcessCasinoBetService,
    ProcessCasinoCreditService,
    UpdatePushedBetService,
    CasinoGamePostProcessService,
    GAME_ROUND_REPOSITORY_TOKEN,
    GAME_TRANSACTION_REPOSITORY_TOKEN,
  ],
})
export class CasinoModule { }

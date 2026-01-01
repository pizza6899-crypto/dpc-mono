// src/modules/casino-refactor/aggregator/dc/dc.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from 'src/common/env/env.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { ExchangeModule } from 'src/modules/exchange/exchange.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { CasinoModule } from 'src/modules/casino/casino.module';
import { DcCallbackController } from './controllers/dc-callback.controller';
import { DcMapperService } from './infrastructure/dc-mapper.service';
import { DcAggregatorApiAdapter } from './infrastructure/dc-aggregator-api.adapter';
import { DC_AGGREGATOR_API } from './ports/out/dc-aggregator-api.token';
import { LaunchDcGameService } from './application/launch-dc-game.service';
import { GameSessionService } from '../../application/game-session.service';
import { DcCallbackValidatorService } from './application/dc-callback-validator.service';
import { DcBalanceCallbackService } from './application/dc-balance-callback.service';
import { WagerDcBetCallbackUseCase } from './application/use-cases/wager-dc-bet-callback.use-case';
import { CancelWagerDcBetCallbackUseCase } from './application/use-cases/cancel-wager-dc-bet-callback.use-case';
import { AppendWagerDcBetCallbackUseCase } from './application/use-cases/append-wager-dc-bet-callback.use-case';
import { EndWagerDcBetCallbackUseCase } from './application/use-cases/end-wager-dc-bet-callback.use-case';
import { FreeSpinResultDcBetCallbackUseCase } from './application/use-cases/free-spin-result-dc-bet-callback.use-case';
import { PromoPayoutDcBetCallbackUseCase } from './application/use-cases/promo-payout-dc-bet-callback.use-case';
import { GetBalanceDcCallbackUseCase } from './application/use-cases/get-balance-dc-callback.use-case';
import { DcCallbackValidationGuard } from './guards/dc-callback-validation.guard';
import { DcCallbackExceptionFilter } from './filters/dc-callback-exception.filter';
import { DcBalanceFormatInterceptor } from './interceptors/dc-balance-format.interceptor';

@Module({
  imports: [
    HttpModule,
    EnvModule,
    AuditLogModule,
    ExchangeModule,
    PrismaModule,
    CasinoModule,
  ],
  providers: [
    DcMapperService,
    GameSessionService,
    LaunchDcGameService,
    DcCallbackValidatorService,
    DcBalanceCallbackService,
    WagerDcBetCallbackUseCase,
    CancelWagerDcBetCallbackUseCase,
    AppendWagerDcBetCallbackUseCase,
    EndWagerDcBetCallbackUseCase,
    FreeSpinResultDcBetCallbackUseCase,
    PromoPayoutDcBetCallbackUseCase,
    GetBalanceDcCallbackUseCase,
    DcCallbackValidationGuard,
    DcCallbackExceptionFilter,
    DcBalanceFormatInterceptor,
    {
      provide: DC_AGGREGATOR_API,
      useClass: DcAggregatorApiAdapter,
    },
  ],
  controllers: [DcCallbackController],
  exports: [DC_AGGREGATOR_API, DcMapperService, LaunchDcGameService],
})
export class DcModule {}


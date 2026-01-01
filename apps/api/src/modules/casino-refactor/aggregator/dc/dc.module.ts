// src/modules/casino-refactor/aggregator/dc/dc.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from 'src/common/env/env.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { ExchangeModule } from 'src/modules/exchange/exchange.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { CasinoRefactorModule } from '../../casino-refactor.module';
import { DcCallbackController } from './controllers/dc-callback.controller';
import { DcMapperService } from './infrastructure/dc-mapper.service';
import { DcAggregatorApiAdapter } from './infrastructure/dc-aggregator-api.adapter';
import { DC_AGGREGATOR_API } from './ports/out/dc-aggregator-api.token';
import { LaunchDcGameService } from './application/launch-dc-game.service';
import { GameSessionService } from '../../application/game-session.service';
import { GameBalanceService } from '../../application/game-balance.service';
import { DcCallbackValidatorService } from './application/dc-callback-validator.service';
import { DcCallbackValidationGuard } from './guards/dc-callback-validation.guard';
import { DcCallbackExceptionFilter } from './filters/dc-callback-exception.filter';
import { DcAuditLogInterceptor } from './interceptors/dc-audit-log.interceptor';

@Module({
  imports: [
    HttpModule,
    EnvModule,
    AuditLogModule,
    ExchangeModule,
    PrismaModule,
    forwardRef(() => CasinoRefactorModule),
  ],
  providers: [
    DcMapperService,
    GameSessionService,
    GameBalanceService,
    LaunchDcGameService,
    DcCallbackValidatorService,
    DcCallbackValidationGuard,
    DcCallbackExceptionFilter,
    DcAuditLogInterceptor,
    {
      provide: DC_AGGREGATOR_API,
      useClass: DcAggregatorApiAdapter,
    },
  ],
  controllers: [DcCallbackController],
  exports: [DC_AGGREGATOR_API, DcMapperService, LaunchDcGameService],
})
export class DcModule {}


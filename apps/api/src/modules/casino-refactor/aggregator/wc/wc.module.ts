// src/modules/casino-refactor/aggregator/wc/wc.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from 'src/common/env/env.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { WcCallbackController } from './controllers/wc-callback.controller';
import { WcMapperService } from './infrastructure/wc-mapper.service';
import { WcAggregatorApiAdapter } from './infrastructure/wc-aggregator-api.adapter';
import { WC_AGGREGATOR_API } from './ports/out/wc-aggregator-api.token';

@Module({
  imports: [HttpModule, EnvModule, AuditLogModule],
  providers: [
    WcMapperService,
    {
      provide: WC_AGGREGATOR_API,
      useClass: WcAggregatorApiAdapter,
    },
  ],
  controllers: [WcCallbackController],
  exports: [WC_AGGREGATOR_API, WcMapperService],
})
export class WcModule {}


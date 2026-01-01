// src/modules/casino-refactor/aggregator/dc/dc.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EnvModule } from 'src/common/env/env.module';
import { AuditLogModule } from 'src/modules/audit-log/audit-log.module';
import { DcCallbackController } from './controllers/dc-callback.controller';
import { DcMapperService } from './infrastructure/dc-mapper.service';
import { DcAggregatorApiAdapter } from './infrastructure/dc-aggregator-api.adapter';
import { DC_AGGREGATOR_API } from './ports/out/dc-aggregator-api.token';

@Module({
  imports: [HttpModule, EnvModule, AuditLogModule],
  providers: [
    DcMapperService,
    {
      provide: DC_AGGREGATOR_API,
      useClass: DcAggregatorApiAdapter,
    },
  ],
  controllers: [DcCallbackController],
  exports: [DC_AGGREGATOR_API, DcMapperService],
})
export class DcModule {}


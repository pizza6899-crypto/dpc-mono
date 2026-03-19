import { Module } from '@nestjs/common';
import { ExchangeRateService } from './application/exchange-rate.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { EnvModule } from 'src/common/env/env.module';
import { HttpModule } from '@nestjs/axios';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OpenExchangeRatesApiService } from './infrastructure/open-exchange-rates-api.service';
import { ExchangeRateUpdateProcessor } from './infrastructure/processors/exchange-rate-update.processor';
import { BullModule } from '@nestjs/bullmq';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { ExchangeRateValidator } from './application/exchange-rate-validator.service';
import { ExchangeController } from './controllers/exchange.controller';
import { AdminExchangeController } from './controllers/admin-exchange.controller';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { EXCHANGE_QUEUES } from './infrastructure/exchange.bullmq';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    EnvModule,
    HttpModule,
    AuditLogModule,
    BullMqModule,
    BullModule.registerQueue(EXCHANGE_QUEUES.RATE_SYNC),
  ],
  providers: [
    ExchangeRateService,
    OpenExchangeRatesApiService,
    ExchangeRateUpdateProcessor,
    ExchangeRateValidator,
  ],
  controllers: [ExchangeController, AdminExchangeController],
  exports: [ExchangeRateService],
})
export class ExchangeModule {}

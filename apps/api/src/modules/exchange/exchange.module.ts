import { Module } from '@nestjs/common';
import { ExchangeRateService } from './application/exchange-rate.service';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { EnvModule } from 'src/common/env/env.module';
import { HttpModule } from '@nestjs/axios';
import { OpenExchangeRatesApiService } from './infrastructure/open-exchange-rates-api.service';
import { ExchangeRateUpdateScheduler } from './schedulers/exchange-rate-update.scheduler';
import { ExchangeRateValidator } from './application/exchange-rate-validator.service';
import { ExchangeController } from './controllers/exchange.controller';
import { AdminExchangeController } from './controllers/admin-exchange.controller';

@Module({
  imports: [
    PrismaModule,
    ConcurrencyModule,
    RedisModule,
    EnvModule,
    HttpModule,
  ],
  providers: [
    ExchangeRateService,
    OpenExchangeRatesApiService,
    ExchangeRateUpdateScheduler,
    ExchangeRateValidator,
  ],
  controllers: [ExchangeController, AdminExchangeController],
  exports: [ExchangeRateService],
})
export class ExchangeModule {}

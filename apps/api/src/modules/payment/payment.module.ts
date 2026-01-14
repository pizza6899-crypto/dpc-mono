import { Module } from '@nestjs/common';
import { NowPaymentApiService } from './infrastructure/now-payment-api.service';
import { NowPaymentCallbackService } from './application/now-payment-callback.service';
import { NowPaymentCallbackController } from './controllers/now-payment-callback.controller';
import { ConcurrencyModule } from '../../common/concurrency/concurrency.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { EnvModule } from 'src/common/env/env.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';

import { HttpModule } from '@nestjs/axios';
import { NowPaymentCallbackLogService } from './application/now-payment-callback-log.service';

@Module({
  imports: [
    ConcurrencyModule,
    RedisModule,
    EnvModule,
    PrismaModule,

    HttpModule,
  ],
  controllers: [
    NowPaymentCallbackController,
  ],
  providers: [
    NowPaymentApiService,
    NowPaymentCallbackService,
    NowPaymentCallbackLogService,
  ],
  exports: [NowPaymentApiService, NowPaymentCallbackService],
})
export class PaymentModule { }

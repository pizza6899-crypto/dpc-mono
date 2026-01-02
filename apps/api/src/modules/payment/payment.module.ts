import { Module } from '@nestjs/common';
import { NowPaymentApiService } from './infrastructure/now-payment-api.service';
import { NowPaymentCallbackService } from './application/now-payment-callback.service';
import { NowPaymentCallbackController } from './controllers/now-payment-callback.controller';
import { ConcurrencyModule } from '../../common/concurrency/concurrency.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { EnvModule } from 'src/common/env/env.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { QueueModule } from 'src/infrastructure/queue/queue.module';
import { HttpModule } from '@nestjs/axios';
import { NowPaymentCallbackLogService } from './application/now-payment-callback-log.service';
import { WithdrawService } from './application/withdraw.service';
import { WithdrawController } from './controllers/withdraw.controller';

@Module({
  imports: [
    ConcurrencyModule,
    RedisModule,
    EnvModule,
    PrismaModule,
    QueueModule,
    HttpModule,
  ],
  controllers: [
    NowPaymentCallbackController,
    WithdrawController,
  ],
  providers: [
    NowPaymentApiService,
    NowPaymentCallbackService,
    NowPaymentCallbackLogService,
    WithdrawService,
  ],
  exports: [NowPaymentApiService, NowPaymentCallbackService, WithdrawService],
})
export class PaymentModule {}

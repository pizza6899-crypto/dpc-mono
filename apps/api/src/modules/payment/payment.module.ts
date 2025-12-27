import { Module } from '@nestjs/common';
import { NowPaymentApiService } from './infrastructure/now-payment-api.service';
import { NowPaymentCallbackService } from './application/now-payment-callback.service';
import { NowPaymentCallbackController } from './controllers/now-payment-callback.controller';
import { ConcurrencyModule } from '../../platform/concurrency/concurrency.module';
import { RedisModule } from '../../platform/redis/redis.module';
import { EnvModule } from '../../platform/env/env.module';
import { PrismaModule } from '../../platform/prisma/prisma.module';
import { QueueModule } from '../../platform/queue/queue.module';
import { HttpModule } from '@nestjs/axios';
import { NowPaymentCallbackLogService } from './application/now-payment-callback-log.service';
import { DepositService } from './application/deposit.service';
import { DepositController } from './controllers/deposit.controller';
import { WithdrawService } from './application/withdraw.service';
import { WithdrawController } from './controllers/withdraw.controller';
import { ACTIVITY_LOG } from 'src/platform/activity-log/activity-log.token';
import { ActivityLogAdapter } from 'src/platform/activity-log/activity-log.adapter';
import { UserValidationModule } from 'src/platform/user-validation/user-validation.module';
import { BankTransferDepositService } from './application/bank-transfer-deposit.service';
import { CryptoDepositService } from './application/crypto-deposit.service';
import { AdminDepositController } from './controllers/admin-deposit.controller';
import { AdminDepositService } from './application/admin-deposit.service';
import { RollingModule } from '../rolling/rolling.module';
import { UserStatsModule } from '../user-stats/user-stats.module';

@Module({
  imports: [
    ConcurrencyModule,
    RedisModule,
    EnvModule,
    PrismaModule,
    QueueModule,
    HttpModule,
    UserValidationModule,
    RollingModule,
    UserStatsModule,
  ],
  controllers: [
    NowPaymentCallbackController,
    DepositController,
    WithdrawController,
    AdminDepositController,
  ],
  providers: [
    NowPaymentApiService,
    NowPaymentCallbackService,
    NowPaymentCallbackLogService,
    DepositService,
    WithdrawService,
    {
      provide: ACTIVITY_LOG,
      useClass: ActivityLogAdapter,
    },
    BankTransferDepositService,
    CryptoDepositService,
    AdminDepositService,
  ],
  exports: [NowPaymentApiService, NowPaymentCallbackService, WithdrawService],
})
export class PaymentModule {}

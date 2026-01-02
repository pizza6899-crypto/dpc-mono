// src/modules/deposit/deposit.module.ts
import { Module } from '@nestjs/common';
import { DepositController } from './controllers/user/deposit.controller';
import { AdminDepositController } from './controllers/admin/deposit.controller';
import { ConcurrencyModule } from '../../common/concurrency/concurrency.module';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { UserValidationModule } from 'src/common/user-validation/user-validation.module';
import { RollingModule } from '../rolling/rolling.module';
import { UserStatsModule } from '../user-stats/user-stats.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [
    ConcurrencyModule,
    PrismaModule,
    EnvModule,
    UserValidationModule,
    RollingModule,
    UserStatsModule,
    PaymentModule, // NowPaymentApiService 사용을 위해
  ],
  providers: [
  ],
  controllers: [
    DepositController,
    AdminDepositController,
  ],
  exports: [
  ],
})
export class DepositModule {}


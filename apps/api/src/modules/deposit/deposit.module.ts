// src/modules/deposit/deposit.module.ts
import { Module } from '@nestjs/common';
import { UserDepositController } from './controllers/user/deposit.controller';
import { AdminDepositController } from './controllers/admin/deposit.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/infrastructure/env/env.module';
import { PaymentModule } from '../payment/payment.module';
import { PromotionModule } from '../promotion/promotion.module';
import { ConcurrencyModule } from 'src/infrastructure/concurrency/concurrency.module';
import { AdminMemoModule } from '../admin-memo/admin-memo.module';
import { GetDepositStatsService } from './application/get-deposit-stats.service';
import { GetDepositsService } from './application/get-deposits.service';
import { GetDepositDetailService } from './application/get-deposit-detail.service';
import { ProcessDepositService } from './application/process-deposit.service';
import { ApproveDepositService } from './application/approve-deposit.service';
import { RejectDepositService } from './application/reject-deposit.service';
import { CancelDepositService } from './application/cancel-deposit.service';
import { CreateCryptoDepositService } from './application/create-crypto-deposit.service';
import { CreateFiatDepositService } from './application/create-fiat-deposit.service';
import { GetMyDepositsService } from './application/get-my-deposits.service';
import { DepositDetailMapper } from './infrastructure/deposit-detail.mapper';
import { DepositDetailRepository } from './infrastructure/deposit-detail.repository';
import { DepositRequirementPolicy } from './domain/policy/deposit-requirement.policy';
import { DEPOSIT_DETAIL_REPOSITORY } from './ports';
import { SnowflakeModule } from 'src/infrastructure/snowflake/snowflake.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    PaymentModule, // NowPaymentApiService 사용을 위해
    PromotionModule, // CheckEligiblePromotionsService 사용을 위해
    ConcurrencyModule,
    SnowflakeModule,
    NotificationModule,
    AdminMemoModule,
  ],
  providers: [
    // Infrastructure (Mapper)
    DepositDetailMapper,
    DepositRequirementPolicy,
    {
      provide: DEPOSIT_DETAIL_REPOSITORY,
      useClass: DepositDetailRepository,
    },

    // Use Case Services
    GetDepositStatsService,
    GetDepositsService,
    GetDepositDetailService,
    ProcessDepositService,
    ApproveDepositService,
    RejectDepositService,
    CancelDepositService,

    CreateCryptoDepositService,
    CreateFiatDepositService,
    GetMyDepositsService,
  ],
  controllers: [UserDepositController, AdminDepositController],
  exports: [
    GetDepositStatsService,
    GetDepositsService,
    GetDepositDetailService,
    ProcessDepositService,
    ApproveDepositService,
    RejectDepositService,
    CancelDepositService,

    CreateCryptoDepositService,
    CreateFiatDepositService,
    GetMyDepositsService,
  ],
})
export class DepositModule {}

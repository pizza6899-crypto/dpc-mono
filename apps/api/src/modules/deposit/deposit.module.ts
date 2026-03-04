// src/modules/deposit/deposit.module.ts
import { Module } from '@nestjs/common';
import { DepositController } from './controllers/user/deposit.controller';
import { AdminDepositController } from './controllers/admin/deposit.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { PaymentModule } from '../payment/payment.module';
import { WalletModule } from '../wallet/wallet.module';
import { PromotionModule } from '../promotion/promotion.module';
import { WageringModule } from '../wagering/wagering.module';
import { TierEvaluatorModule } from '../tier/evaluator/tier-evaluator.module';
import { ExchangeModule } from '../exchange/exchange.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { GetDepositStatsService } from './application/get-deposit-stats.service';
import { GetDepositsService } from './application/get-deposits.service';
import { GetDepositDetailService } from './application/get-deposit-detail.service';
import { ApproveDepositService } from './application/approve-deposit.service';
import { RejectDepositService } from './application/reject-deposit.service';
import { CancelDepositService } from './application/cancel-deposit.service';
import { CreateCryptoDepositService } from './application/create-crypto-deposit.service';
import { CreateFiatDepositService } from './application/create-fiat-deposit.service';
import { GetMyDepositsService } from './application/get-my-deposits.service';
import { DepositDetailMapper } from './infrastructure/deposit-detail.mapper';
import { DepositDetailRepository } from './infrastructure/deposit-detail.repository';
import {
  DEPOSIT_DETAIL_REPOSITORY,
} from './ports/out';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    PaymentModule, // NowPaymentApiService 사용을 위해
    WalletModule, // UpdateUserBalanceAdminService 사용을 위해
    PromotionModule, // CheckEligiblePromotionsService 사용을 위해
    WageringModule,
    TierEvaluatorModule,
    ExchangeModule,
    ConcurrencyModule,
    SnowflakeModule,
  ],
  providers: [
    // Infrastructure (Mapper)
    DepositDetailMapper,
    {
      provide: DEPOSIT_DETAIL_REPOSITORY,
      useClass: DepositDetailRepository,
    },

    // Use Case Services
    GetDepositStatsService,
    GetDepositsService,
    GetDepositDetailService,
    ApproveDepositService,
    RejectDepositService,
    CancelDepositService,

    CreateCryptoDepositService,
    CreateFiatDepositService,
    GetMyDepositsService,
  ],
  controllers: [DepositController, AdminDepositController],
  exports: [
    GetDepositStatsService,
    GetDepositsService,
    GetDepositDetailService,
    ApproveDepositService,
    RejectDepositService,
    CancelDepositService,

    CreateCryptoDepositService,
    CreateFiatDepositService,
    GetMyDepositsService,
  ],
})
export class DepositModule { }

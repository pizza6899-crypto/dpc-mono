// src/modules/deposit/deposit.module.ts
import { Module } from '@nestjs/common';
import { DepositController } from './controllers/user/deposit.controller';
import { AdminDepositController } from './controllers/admin/deposit.controller';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { EnvModule } from 'src/common/env/env.module';
import { UserValidationModule } from 'src/common/user-validation/user-validation.module';
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
import { FindBankConfigsAdminService } from './application/find-bank-configs-admin.service';
import { GetBankConfigAdminService } from './application/get-bank-config-admin.service';
import { UpdateBankConfigAdminService } from './application/update-bank-config-admin.service';
import { DeleteBankConfigAdminService } from './application/delete-bank-config-admin.service';
import { FindCryptoConfigsAdminService } from './application/find-crypto-configs-admin.service';
import { GetCryptoConfigAdminService } from './application/get-crypto-config-admin.service';
import { CreateCryptoConfigService } from './application/create-crypto-config.service';
import { UpdateCryptoConfigAdminService } from './application/update-crypto-config-admin.service';
import { DeleteCryptoConfigAdminService } from './application/delete-crypto-config-admin.service';
import { GetAvailableDepositMethodsService } from './application/get-available-deposit-methods.service';
import { CreateBankConfigService } from './application/create-bank-config.service';
import { CreateCryptoDepositService } from './application/create-crypto-deposit.service';
import { CreateBankDepositService } from './application/create-bank-deposit.service';
import { GetMyDepositsService } from './application/get-my-deposits.service';
import { GetMyDepositDetailService } from './application/get-my-deposit-detail.service';
import { DepositDetailMapper } from './infrastructure/deposit-detail.mapper';
import { DepositDetailRepository } from './infrastructure/deposit-detail.repository';
import { BankConfigMapper } from './infrastructure/bank-config.mapper';
import { BankConfigRepository } from './infrastructure/bank-config.repository';
import { CryptoConfigMapper } from './infrastructure/crypto-config.mapper';
import { CryptoConfigRepository } from './infrastructure/crypto-config.repository';
import {
  DEPOSIT_DETAIL_REPOSITORY,
  BANK_CONFIG_REPOSITORY,
  CRYPTO_CONFIG_REPOSITORY,
} from './ports/out';

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    UserValidationModule,
    PaymentModule, // NowPaymentApiService 사용을 위해
    WalletModule, // UpdateUserBalanceAdminService 사용을 위해
    PromotionModule, // CheckEligiblePromotionsService 사용을 위해
    WageringModule,
    TierEvaluatorModule,
    ExchangeModule,
    ConcurrencyModule,
  ],
  providers: [
    // Infrastructure (Mapper)
    DepositDetailMapper,
    BankConfigMapper,
    CryptoConfigMapper,

    // Repository (Outbound Port 구현)
    {
      provide: DEPOSIT_DETAIL_REPOSITORY,
      useClass: DepositDetailRepository,
    },
    {
      provide: BANK_CONFIG_REPOSITORY,
      useClass: BankConfigRepository,
    },
    {
      provide: CRYPTO_CONFIG_REPOSITORY,
      useClass: CryptoConfigRepository,
    },

    // Use Case Services
    GetDepositStatsService,
    GetDepositsService,
    GetDepositDetailService,
    ApproveDepositService,
    RejectDepositService,
    CancelDepositService,
    FindBankConfigsAdminService,
    GetBankConfigAdminService,
    UpdateBankConfigAdminService,
    DeleteBankConfigAdminService,

    FindCryptoConfigsAdminService,
    GetCryptoConfigAdminService,
    CreateCryptoConfigService,
    UpdateCryptoConfigAdminService,
    DeleteCryptoConfigAdminService,

    GetAvailableDepositMethodsService,
    CreateBankConfigService,
    CreateCryptoDepositService,
    CreateBankDepositService,
    GetMyDepositsService,
    GetMyDepositDetailService,
  ],
  controllers: [
    DepositController,
    AdminDepositController,
  ],
  exports: [
    GetDepositStatsService,
    GetDepositsService,
    GetDepositDetailService,
    ApproveDepositService,
    RejectDepositService,
    CancelDepositService,
    FindBankConfigsAdminService,
    GetBankConfigAdminService,
    UpdateBankConfigAdminService,
    DeleteBankConfigAdminService,

    FindCryptoConfigsAdminService,
    GetCryptoConfigAdminService,
    CreateCryptoConfigService,
    UpdateCryptoConfigAdminService,
    DeleteCryptoConfigAdminService,

    GetAvailableDepositMethodsService,
    CreateBankConfigService,
    CreateCryptoDepositService,
    CreateBankDepositService,
    GetMyDepositsService,
    GetMyDepositDetailService,
  ],
})
export class DepositModule { }


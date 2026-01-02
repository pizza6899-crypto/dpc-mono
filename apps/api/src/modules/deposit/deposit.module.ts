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
import { WalletModule } from '../wallet/wallet.module';
import { GetDepositStatsService } from './application/get-deposit-stats.service';
import { GetDepositsService } from './application/get-deposits.service';
import { GetDepositDetailService } from './application/get-deposit-detail.service';
import { ApproveDepositService } from './application/approve-deposit.service';
import { RejectDepositService } from './application/reject-deposit.service';
import { AdminBankConfigService } from './application/admin-bank-config.service';
import { AdminCryptoConfigService } from './application/admin-crypto-config.service';
import { GetAvailableDepositMethodsService } from './application/get-available-deposit-methods.service';
import { CreateBankConfigService } from './application/create-bank-config.service';
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
    ConcurrencyModule,
    PrismaModule,
    EnvModule,
    UserValidationModule,
    RollingModule,
    UserStatsModule,
    PaymentModule, // NowPaymentApiService 사용을 위해
    WalletModule, // UpdateUserBalanceAdminService 사용을 위해
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
    AdminBankConfigService,
    AdminCryptoConfigService,
    GetAvailableDepositMethodsService,
    CreateBankConfigService,
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
    AdminBankConfigService,
    AdminCryptoConfigService,
    GetAvailableDepositMethodsService,
    CreateBankConfigService,
  ],
})
export class DepositModule { }


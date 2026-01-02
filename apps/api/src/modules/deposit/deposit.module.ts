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
import { DepositDetailMapper } from './infrastructure/deposit-detail.mapper';
import { DepositDetailRepository } from './infrastructure/deposit-detail.repository';
import { DEPOSIT_DETAIL_REPOSITORY } from './ports/out';

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

    // Repository (Outbound Port 구현)
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
    AdminBankConfigService,
    AdminCryptoConfigService,
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
  ],
})
export class DepositModule {}


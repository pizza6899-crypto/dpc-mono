// src/modules/affiliate/commission/commission.module.ts
import { Module } from '@nestjs/common';
import { AffiliateReferralModule } from '../referral/referral.module';
import { CommissionPolicy } from './domain';

// Use Case Services
import { CalculateCommissionService } from './application/calculate-commission.service';
import { AccumulateCommissionService } from './application/accumulate-commission.service';
import { SettleDailyCommissionsService } from './application/settle-daily-commissions.service';
import { GetWalletBalanceService } from './application/get-wallet-balance.service';
import { WithdrawCommissionService } from './application/withdraw-commission.service';
import { FindCommissionsService } from './application/find-commissions.service';
import { FindCommissionByIdService } from './application/find-commission-by-id.service';

// Infrastructure
import { AffiliateWalletMapper } from './infrastructure/affiliate-wallet.mapper';
import { AffiliateWalletRepository } from './infrastructure/affiliate-wallet.repository';
import { AffiliateCommissionMapper } from './infrastructure/affiliate-commission.mapper';
import { AffiliateCommissionRepository } from './infrastructure/affiliate-commission.repository';

// Ports
import { AFFILIATE_WALLET_REPOSITORY } from './ports/out/affiliate-wallet.repository.token';
import { AFFILIATE_COMMISSION_REPOSITORY } from './ports/out/affiliate-commission.repository.token';

// Controllers
import { AffiliateCommissionController } from './controllers/user/commission.controller';
import { AdminCommissionController } from './controllers/admin/commission.controller';

// Schedulers
import { SettleDailyCommissionsProcessor } from '../infrastructure/processors/settle-daily-commissions.processor';
import { BullModule } from '@nestjs/bullmq';
import { EnvModule } from 'src/common/env/env.module';
import { BullMqModule } from 'src/infrastructure/bullmq/bullmq.module';
import { AFFILIATE_QUEUES } from './infrastructure/commission.bullmq';

@Module({
  imports: [
    EnvModule,
    AffiliateReferralModule, // 레퍼럴 관계 조회를 위해 필요
    BullMqModule,
    BullModule.registerQueue({
      name: AFFILIATE_QUEUES.COMMISSION.name,
    }),
  ],
  providers: [
    // Domain Policy
    CommissionPolicy,

    // Infrastructure (Mapper)
    AffiliateWalletMapper,
    AffiliateCommissionMapper,

    // Repository (Outbound Port 구현)
    {
      provide: AFFILIATE_WALLET_REPOSITORY,
      useClass: AffiliateWalletRepository,
    },
    {
      provide: AFFILIATE_COMMISSION_REPOSITORY,
      useClass: AffiliateCommissionRepository,
    },

    // Use Case Services
    FindCommissionByIdService,
    FindCommissionsService,
    GetWalletBalanceService,
    CalculateCommissionService,
    AccumulateCommissionService,
    SettleDailyCommissionsService,
    WithdrawCommissionService,

    // Processors
    SettleDailyCommissionsProcessor,
  ],
  controllers: [AffiliateCommissionController, AdminCommissionController],
  exports: [
    // Use Case Services (다른 모듈에서 사용 가능)
    CalculateCommissionService, // 게임 모듈에서 사용
    AccumulateCommissionService, // 게임 모듈에서 사용
    GetWalletBalanceService,
  ],
})
export class AffiliateCommissionModule {}

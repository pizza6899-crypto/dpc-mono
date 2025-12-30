// src/modules/affiliate/commission/commission.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { ActivityLogModule } from 'src/common/activity-log/activity-log.module';
import { AffiliateReferralModule } from '../referral/referral.module';
import { CommissionPolicy } from './domain';

// Use Case Services
import { CalculateCommissionService } from './application/calculate-commission.service';
import { AccumulateCommissionService } from './application/accumulate-commission.service';
import { SettleDailyCommissionsService } from './application/settle-daily-commissions.service';
import { GetWalletBalanceService } from './application/get-wallet-balance.service';
import { WithdrawCommissionService } from './application/withdraw-commission.service';
import { GetCommissionRateService } from './application/get-commission-rate.service';
import { SetCustomRateService } from './application/set-custom-rate.service';
import { ResetCustomRateService } from './application/reset-custom-rate.service';
import { FindCommissionsService } from './application/find-commissions.service';
import { FindCommissionByIdService } from './application/find-commission-by-id.service';

// Infrastructure
import { AffiliateWalletMapper } from './infrastructure/affiliate-wallet.mapper';
import { AffiliateWalletRepository } from './infrastructure/affiliate-wallet.repository';
import { AffiliateCommissionMapper } from './infrastructure/affiliate-commission.mapper';
import { AffiliateCommissionRepository } from './infrastructure/affiliate-commission.repository';
import { AffiliateTierMapper } from './infrastructure/affiliate-tier.mapper';
import { AffiliateTierRepository } from './infrastructure/affiliate-tier.repository';

// Ports
import { AFFILIATE_WALLET_REPOSITORY } from './ports/out/affiliate-wallet.repository.token';
import { AFFILIATE_COMMISSION_REPOSITORY } from './ports/out/affiliate-commission.repository.token';
import { AFFILIATE_TIER_REPOSITORY } from './ports/out/affiliate-tier.repository.token';

// Controllers
import { AffiliateCommissionController } from './controllers/user/commission.controller';
import { AdminCommissionController } from './controllers/admin/commission.controller';

// Schedulers
import { SettleDailyCommissionsScheduler } from './schedulers/settle-daily-commissions.scheduler';
import { EnvModule } from 'src/common/env/env.module';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
  imports: [
    PrismaModule, // PrismaService를 위해 필요
    EnvModule,
    ConcurrencyModule,
    ActivityLogModule, // Activity Log를 위해 필요
    AffiliateReferralModule, // 레퍼럴 관계 조회를 위해 필요
  ],
  providers: [
    // Domain Policy
    CommissionPolicy,

    // Infrastructure (Mapper)
    AffiliateWalletMapper,
    AffiliateCommissionMapper,
    AffiliateTierMapper,

    // Repository (Outbound Port 구현)
    {
      provide: AFFILIATE_WALLET_REPOSITORY,
      useClass: AffiliateWalletRepository,
    },
    {
      provide: AFFILIATE_COMMISSION_REPOSITORY,
      useClass: AffiliateCommissionRepository,
    },
    {
      provide: AFFILIATE_TIER_REPOSITORY,
      useClass: AffiliateTierRepository,
    },

    // Use Case Services
    FindCommissionByIdService,
    FindCommissionsService,
    GetWalletBalanceService,
    GetCommissionRateService,
    SetCustomRateService,
    ResetCustomRateService,
    CalculateCommissionService,
    AccumulateCommissionService,
    SettleDailyCommissionsService,
    WithdrawCommissionService,

    // Schedulers
    SettleDailyCommissionsScheduler,
  ],
  controllers: [AffiliateCommissionController, AdminCommissionController],
  exports: [
    // Use Case Services (다른 모듈에서 사용 가능)
    CalculateCommissionService, // 게임 모듈에서 사용
    AccumulateCommissionService, // 게임 모듈에서 사용
    GetWalletBalanceService,
    GetCommissionRateService,
  ],
})
export class AffiliateCommissionModule {}

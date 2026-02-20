import { Module } from '@nestjs/common';
import { TierDefinitionsModule } from '../definitions/tier-definitions.module';
import { TierProfileModule } from '../profile/tier-profile.module';
import { TierRewardController } from './controllers/user/tier-reward.controller';
import { TierRewardRepositoryPort } from './infrastructure/tier-reward.repository.port';
import { TierRewardRepository } from './infrastructure/tier-reward.repository';
import { GetAvailableRewardsService } from './application/get-available-rewards.service';
import { ClaimRewardService } from './application/claim-reward.service';
import { IssueRewardService } from './application/issue-reward.service';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';
import { WalletModule } from '../../wallet/wallet.module';
import { WageringModule } from '../../wagering/wagering.module';
import { ExchangeModule } from '../../exchange/exchange.module';
import { TierRewardAdminController } from './controllers/admin/tier-reward-admin.controller';

@Module({
  imports: [
    TierDefinitionsModule,
    TierProfileModule,
    ConcurrencyModule,
    WalletModule,
    WageringModule,
    ExchangeModule,
  ],
  controllers: [TierRewardController, TierRewardAdminController],
  providers: [
    { provide: TierRewardRepositoryPort, useClass: TierRewardRepository },
    GetAvailableRewardsService,
    ClaimRewardService,
    IssueRewardService,
  ],
  exports: [
    IssueRewardService, // 타 모듈(Evaluator)에서 보상 발행 시 호출
    ClaimRewardService, // 자동 지급 시 호출 가능
  ],
})
export class TierRewardModule {}

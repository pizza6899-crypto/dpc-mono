import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { REWARD_REPOSITORY } from './ports/reward.repository.port';
import { RewardRepository } from './infrastructure/reward.repository';
import { ClaimRewardService } from './application/claim-reward.service';
import { GrantRewardService } from './application/grant-reward.service';
import { GetUserRewardsService } from './application/get-user-rewards.service';
import { GetAdminRewardsService } from './application/get-admin-rewards.service';
import { VoidRewardService } from './application/void-reward.service';
import { RewardController } from './controllers/user/reward.controller';
import { RewardAdminController } from './controllers/admin/reward-admin.controller';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { SqidsModule } from 'src/common/sqids/sqids.module';
import { ConcurrencyModule } from 'src/common/concurrency';
import { WalletModule } from 'src/modules/wallet/wallet.module';
import { RequirementModule } from 'src/modules/wagering/requirement/requirement.module';

@Module({
    imports: [
        PrismaModule,
        SnowflakeModule,
        SqidsModule,
        ConcurrencyModule,
        WalletModule,
        RequirementModule,
    ],
    controllers: [
        RewardController,
        RewardAdminController,
    ],
    providers: [
        {
            provide: REWARD_REPOSITORY,
            useClass: RewardRepository,
        },
        ClaimRewardService,
        GrantRewardService,
        GetUserRewardsService,
        GetAdminRewardsService,
        VoidRewardService,
    ],
    exports: [
        REWARD_REPOSITORY,
        ClaimRewardService,
        GrantRewardService,
        GetUserRewardsService,
        GetAdminRewardsService,
        VoidRewardService,
    ],
})
export class RewardCoreModule { }

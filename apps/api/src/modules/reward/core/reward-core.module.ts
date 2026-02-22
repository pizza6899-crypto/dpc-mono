// src/modules/reward/core/reward-core.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { REWARD_REPOSITORY } from './ports/reward.repository.port';
import { RewardRepository } from './infrastructure/reward.repository';

@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: REWARD_REPOSITORY,
            useClass: RewardRepository,
        },
        // 향후 Application Service 들이 이곳에 추가됩니다.
        // 예: GrantRewardService, ClaimRewardService 등
    ],
    exports: [
        REWARD_REPOSITORY,
        // 다른 모듈(예: Tier/Comp)에서 사용할 수 있도록 외부 공개
    ],
})
export class RewardCoreModule { }

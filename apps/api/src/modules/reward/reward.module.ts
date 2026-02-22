// src/modules/reward/reward.module.ts
import { Module } from '@nestjs/common';
import { RewardCoreModule } from './core/reward-core.module';

@Module({
    imports: [
        RewardCoreModule,
        // 향후 확장될 서브모듈들이 이곳에 추가됩니다.
        // RewardCouponModule, RewardEventModule 등
    ],
    exports: [
        RewardCoreModule, // 외부 모듈에서 RewardCoreModule의 Service를 사용할 수 있도록 재수출
    ],
})
export class RewardModule { }

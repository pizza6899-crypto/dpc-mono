// src/modules/reward/reward.module.ts
import { Module } from '@nestjs/common';
import { RewardCoreModule } from './core/reward-core.module';

@Module({
  imports: [
    RewardCoreModule
  ],
  exports: [
    RewardCoreModule, // 외부 모듈에서 RewardCoreModule의 Service를 사용할 수 있도록 재수출
  ],
})
export class RewardModule { }

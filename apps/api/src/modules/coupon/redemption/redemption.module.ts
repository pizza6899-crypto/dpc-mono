import { Module } from '@nestjs/common';
import { CouponConfigModule } from '../config/config.module';
import { CouponCoreModule } from '../core/core.module';
import { RewardCoreModule } from '../../reward/core/reward-core.module';

@Module({
  imports: [
    CouponConfigModule,
    CouponCoreModule,
    RewardCoreModule,
  ],
})
export class CouponRedemptionModule { }

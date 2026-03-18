import { Module } from '@nestjs/common';
import { CouponConfigModule } from '../config/config.module';
import { CouponCoreModule } from '../core/core.module';
import { RewardCoreModule } from '../../reward/core/reward-core.module';
import { ApplyCouponService } from './application/apply-coupon.service';

@Module({
  imports: [
    CouponConfigModule,
    CouponCoreModule,
    RewardCoreModule,
  ],
  providers: [
    ApplyCouponService,
  ],
  exports: [
    ApplyCouponService,
  ],
})
export class CouponRedemptionModule { }

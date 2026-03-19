import { Module } from '@nestjs/common';
import { CouponConfigModule } from '../config/config.module';
import { CouponCoreModule } from '../core/core.module';
import { RewardCoreModule } from '../../reward/core/reward-core.module';
import { ApplyCouponService } from './application/apply-coupon.service';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';

@Module({
  imports: [
    CouponConfigModule,
    CouponCoreModule,
    RewardCoreModule,
    SnowflakeModule,
  ],
  providers: [
    ApplyCouponService,
  ],
  exports: [
    ApplyCouponService,
  ],
})
export class CouponRedemptionModule { }

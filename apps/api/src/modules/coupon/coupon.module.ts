import { Module } from '@nestjs/common';
import { CouponConfigModule } from './config/config.module';
import { CouponCoreModule } from './core/core.module';
import { CouponRedemptionModule } from './redemption/redemption.module';

@Module({
  imports: [
    CouponConfigModule,
    CouponCoreModule,
    CouponRedemptionModule,
  ],
  exports: [
    CouponConfigModule,
    CouponCoreModule,
    CouponRedemptionModule,
  ],
})
export class CouponModule {}

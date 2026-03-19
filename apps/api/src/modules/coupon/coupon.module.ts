import { Module } from '@nestjs/common';
import { CouponConfigModule } from './config/config.module';
import { CouponCoreModule } from './core/core.module';

@Module({
  imports: [
    CouponConfigModule,
    CouponCoreModule,
  ],
  exports: [
    CouponConfigModule,
    CouponCoreModule,
  ],
})
export class CouponModule { }

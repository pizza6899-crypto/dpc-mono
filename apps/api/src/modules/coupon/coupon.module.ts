import { Module } from '@nestjs/common';
import { CouponConfigModule } from './config/config.module';

@Module({
  imports: [
    CouponConfigModule,
  ],
  exports: [
    CouponConfigModule,
  ],
})
export class CouponModule { }

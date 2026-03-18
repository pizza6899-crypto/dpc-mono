import { Module } from '@nestjs/common';
import { CreateCouponService } from './application/create-coupon.service';
import { GetCouponService } from './application/get-coupon.service';
import { CouponRepository } from './infrastructure/coupon.repository';
import { COUPON_REPOSITORY_TOKEN } from './ports/coupon.repository.token';
import { CouponAdminController } from './controllers/admin/coupon-admin.controller';

@Module({
  controllers: [CouponAdminController],
  providers: [
    CreateCouponService,
    GetCouponService,
    {
      provide: COUPON_REPOSITORY_TOKEN,
      useClass: CouponRepository,
    },
  ],
  exports: [GetCouponService, COUPON_REPOSITORY_TOKEN],
})
export class CouponCoreModule {}

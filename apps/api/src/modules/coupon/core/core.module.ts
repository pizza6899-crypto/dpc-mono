import { Module } from '@nestjs/common';
import { CreateCouponService } from './application/create-coupon.service';
import { GetCouponService } from './application/get-coupon.service';
import { ListCouponsService } from './application/list-coupons.service';
import { UpdateCouponService } from './application/update-coupon.service';
import { UpdateCouponStatusService } from './application/update-coupon-status.service';
import { CouponRepository } from './infrastructure/coupon.repository';
import { COUPON_REPOSITORY_TOKEN } from './ports/coupon.repository.token';
import { AdminCouponController } from './controllers/admin/admin-coupon.controller';

@Module({
  controllers: [AdminCouponController],
  providers: [
    {
      provide: COUPON_REPOSITORY_TOKEN,
      useClass: CouponRepository,
    },
    CreateCouponService,
    GetCouponService,
    ListCouponsService,
    UpdateCouponService,
    UpdateCouponStatusService,
  ],
  exports: [
    COUPON_REPOSITORY_TOKEN,
    CreateCouponService,
    GetCouponService,
    ListCouponsService,
    UpdateCouponService,
    UpdateCouponStatusService,
  ],
})
export class CouponCoreModule {}

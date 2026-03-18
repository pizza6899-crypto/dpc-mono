import { Module } from '@nestjs/common';
import { CreateCouponService } from './application/create-coupon.service';
import { GetCouponService } from './application/get-coupon.service';
import { CouponRepository } from './infrastructure/coupon.repository';
import { COUPON_REPOSITORY_TOKEN } from './ports/coupon.repository.token';
import { USER_COUPON_REPOSITORY_TOKEN } from './ports/user-coupon.repository.token';
import { UserCouponRepository } from './infrastructure/user-coupon.repository';
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
    {
      provide: USER_COUPON_REPOSITORY_TOKEN,
      useClass: UserCouponRepository,
    },
  ],
  exports: [GetCouponService, COUPON_REPOSITORY_TOKEN, USER_COUPON_REPOSITORY_TOKEN],
})
export class CouponCoreModule {}

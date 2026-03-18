import { Module } from '@nestjs/common';
import { CouponRepository } from './infrastructure/coupon.repository';
import { COUPON_REPOSITORY_TOKEN } from './ports/coupon.repository.token';
import { USER_COUPON_REPOSITORY_TOKEN } from './ports/user-coupon.repository.token';
import { UserCouponRepository } from './infrastructure/user-coupon.repository';

import { AdminCouponController } from './controllers/admin/admin-coupon.controller';
import { CreateCouponAdminService } from './application/admin/create-coupon.admin.service';
import { UpdateCouponAdminService } from './application/admin/update-coupon.admin.service';
import { UpdateCouponStatusAdminService } from './application/admin/update-coupon-status.admin.service';
import { GetCouponDetailAdminService } from './application/admin/get-coupon-detail.admin.service';
import { GetCouponListAdminService } from './application/admin/get-coupon-list.admin.service';

@Module({
  controllers: [AdminCouponController],
  providers: [
    {
      provide: COUPON_REPOSITORY_TOKEN,
      useClass: CouponRepository,
    },
    {
      provide: USER_COUPON_REPOSITORY_TOKEN,
      useClass: UserCouponRepository,
    },
    CreateCouponAdminService,
    UpdateCouponAdminService,
    UpdateCouponStatusAdminService,
    GetCouponDetailAdminService,
    GetCouponListAdminService,
  ],
  exports: [
    COUPON_REPOSITORY_TOKEN,
    USER_COUPON_REPOSITORY_TOKEN,
    CreateCouponAdminService,
    UpdateCouponAdminService,
    UpdateCouponStatusAdminService,
    GetCouponDetailAdminService,
    GetCouponListAdminService,
  ],
})
export class CouponCoreModule { }

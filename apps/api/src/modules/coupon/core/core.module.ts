import { Module } from '@nestjs/common';
import { CreateCouponService } from './application/create-coupon.service';
import { GetCouponService } from './application/get-coupon.service';
import { ListCouponsService } from './application/list-coupons.service';
import { UpdateCouponService } from './application/update-coupon.service';
import { UpdateCouponStatusService } from './application/update-coupon-status.service';
import { UpdateCouponRewardsService } from './application/update-coupon-rewards.service';
import { ListCouponAllowlistService } from './application/list-coupon-allowlist.service';
import { AddCouponAllowlistService } from './application/add-coupon-allowlist.service';
import { RemoveCouponAllowlistService } from './application/remove-coupon-allowlist.service';
import { ClearCouponAllowlistService } from './application/clear-coupon-allowlist.service';
import { CouponRepository } from './infrastructure/coupon.repository';
import { PrismaCouponAllowlistRepository } from './infrastructure/coupon-allowlist.repository';
import { COUPON_REPOSITORY_TOKEN } from './ports/coupon.repository.token';
import { COUPON_ALLOWLIST_REPOSITORY_TOKEN } from './ports/coupon-allowlist.repository.port';
import { AdminCouponController } from './controllers/admin/admin-coupon.controller';

@Module({
  controllers: [AdminCouponController],
  providers: [
    {
      provide: COUPON_REPOSITORY_TOKEN,
      useClass: CouponRepository,
    },
    {
      provide: COUPON_ALLOWLIST_REPOSITORY_TOKEN,
      useClass: PrismaCouponAllowlistRepository,
    },
    CreateCouponService,
    GetCouponService,
    ListCouponsService,
    UpdateCouponService,
    UpdateCouponStatusService,
    UpdateCouponRewardsService,
    ListCouponAllowlistService,
    AddCouponAllowlistService,
    RemoveCouponAllowlistService,
    ClearCouponAllowlistService,
  ],
  exports: [
    COUPON_REPOSITORY_TOKEN,
    COUPON_ALLOWLIST_REPOSITORY_TOKEN,
    CreateCouponService,
    GetCouponService,
    ListCouponsService,
    UpdateCouponService,
    UpdateCouponStatusService,
    UpdateCouponRewardsService,
    ListCouponAllowlistService,
    AddCouponAllowlistService,
    RemoveCouponAllowlistService,
    ClearCouponAllowlistService,
  ],
})
export class CouponCoreModule {}

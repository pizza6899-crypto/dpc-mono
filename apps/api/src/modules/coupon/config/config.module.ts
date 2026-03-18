import { Module } from '@nestjs/common';
import { GetCouponConfigService } from './application/get-coupon-config.service';
import { UpdateCouponConfigService } from './application/update-coupon-config.service';
import { CouponConfigRepository } from './infrastructure/coupon-config.repository';
import { COUPON_CONFIG_REPOSITORY_TOKEN } from './ports/coupon-config.repository.token';
import { CouponConfigAdminController } from './controllers/admin/coupon-config-admin.controller';

@Module({
  controllers: [CouponConfigAdminController],
  providers: [
    GetCouponConfigService,
    UpdateCouponConfigService,
    {
      provide: COUPON_CONFIG_REPOSITORY_TOKEN,
      useClass: CouponConfigRepository,
    },
  ],
  exports: [GetCouponConfigService],
})
export class CouponConfigModule {}

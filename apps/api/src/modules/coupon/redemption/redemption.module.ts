import { Module } from '@nestjs/common';
import { ApplyCouponService } from './application/apply-coupon.service';
import { UserCouponRepository } from './infrastructure/user-coupon.repository';
import { USER_COUPON_REPOSITORY_TOKEN } from './ports/user-coupon.repository.token';
import { CouponUserController } from './controllers/user/coupon-user.controller';
import { CouponConfigModule } from '../config/config.module';
import { CouponCoreModule } from '../core/core.module';
import { RewardCoreModule } from '../../reward/core/reward-core.module';

@Module({
  imports: [
    CouponConfigModule,
    CouponCoreModule,
    RewardCoreModule,
  ],
  controllers: [CouponUserController],
  providers: [
    ApplyCouponService,
    {
      provide: USER_COUPON_REPOSITORY_TOKEN,
      useClass: UserCouponRepository,
    },
  ],
  exports: [ApplyCouponService],
})
export class CouponRedemptionModule {}

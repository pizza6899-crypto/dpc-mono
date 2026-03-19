import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastructure/prisma/prisma.module';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { RewardModule } from 'src/modules/reward/reward.module';
import { CouponCoreModule } from '../core/core.module';
import { USER_COUPON_REPOSITORY_TOKEN } from './ports/user-coupon.repository.port';
import { PrismaUserCouponRepository } from './infrastructure/user-coupon.repository';
import { ApplyCouponService } from './application/apply-coupon.service';
import { CouponUserController } from './controllers/user/coupon-user.controller';

@Module({
  imports: [
    PrismaModule,
    SnowflakeModule,
    RewardModule,
    CouponCoreModule, // findByCode 및 isUserInAllowlist 호출을 위해 필요
  ],
  controllers: [CouponUserController],
  providers: [
    {
      provide: USER_COUPON_REPOSITORY_TOKEN,
      useClass: PrismaUserCouponRepository,
    },
    ApplyCouponService,
  ],
  exports: [ApplyCouponService],
})
export class CouponRedemptionModule {}

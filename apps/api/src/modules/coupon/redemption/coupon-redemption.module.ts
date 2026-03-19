import { Module } from '@nestjs/common';
import { SnowflakeModule } from 'src/common/snowflake/snowflake.module';
import { RewardModule } from 'src/modules/reward/reward.module';
import { CouponCoreModule } from '../core/core.module';
import { CouponConfigModule } from '../config/config.module';
import { RedisModule } from 'src/infrastructure/redis/redis.module';
import { USER_COUPON_REPOSITORY_TOKEN } from './ports/user-coupon.repository.port';
import { PrismaUserCouponRepository } from './infrastructure/user-coupon.repository';
import { ApplyCouponService } from './application/apply-coupon.service';
import { CouponUserController } from './controllers/user/coupon-user.controller';

@Module({
  imports: [
    SnowflakeModule,
    RewardModule,
    RedisModule,
    CouponCoreModule,
    CouponConfigModule,
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

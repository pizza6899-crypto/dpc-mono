import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponRewardRequestDto } from './create-coupon.request.dto';

export class UpdateAdminCouponRewardsRequestDto {
  @ApiProperty({
    type: [CouponRewardRequestDto],
    description: 'Coupon Rewards / 쿠폰 보체 리스트',
  })
  @ValidateNested({ each: true })
  @Type(() => CouponRewardRequestDto)
  rewards: CouponRewardRequestDto[];
}

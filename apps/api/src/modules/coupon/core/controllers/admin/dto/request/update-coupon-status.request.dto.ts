import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CouponStatus } from '@prisma/client';

export class UpdateAdminCouponStatusRequestDto {
  @ApiProperty({ description: 'Coupon Status / 쿠폰 상태', enum: CouponStatus })
  @IsEnum(CouponStatus)
  status: CouponStatus;
}

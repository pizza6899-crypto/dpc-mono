import { ApiProperty } from '@nestjs/swagger';
import { CouponStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateCouponStatusAdminRequestDto {
  @ApiProperty({ enum: CouponStatus, description: 'New status for the coupon' })
  @IsEnum(CouponStatus)
  status: CouponStatus;
}

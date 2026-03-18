import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCouponConfigRequestDto {
  @ApiPropertyOptional({
    description: 'Is Coupon Enabled / 쿠폰 시스템 활성화 여부',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCouponEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Max Daily Attempts Per User / 유저당 일일 최대 시도 횟수',
    example: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxDailyAttemptsPerUser?: number;

  @ApiPropertyOptional({
    description: 'Default Expiry Days / 기본 유효 기간 (일)',
    example: 60,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultExpiryDays?: number;
}

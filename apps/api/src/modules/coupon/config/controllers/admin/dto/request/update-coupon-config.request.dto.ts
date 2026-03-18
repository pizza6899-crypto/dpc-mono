import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateCouponConfigRequestDto {
  @ApiPropertyOptional({ description: '쿠폰 시스템 활성화 여부' })
  @IsOptional()
  @IsBoolean()
  isCouponEnabled?: boolean;

  @ApiPropertyOptional({ description: '유저당 일일 최대 시도 횟수' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxDailyAttemptsPerUser?: number;

  @ApiPropertyOptional({ description: '기본 유효 기간 (일)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultExpiryDays?: number;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CouponMetadata } from '../../../../domain/coupon.types';

export class UpdateAdminCouponRequestDto {
  @ApiPropertyOptional({ description: 'Coupon Metadata (i18n) / 쿠폰 메타데이터 (다국어)' })
  @IsOptional()
  @IsObject()
  metadata?: CouponMetadata;

  @ApiPropertyOptional({ description: 'Is Allowlist Only / 허용 리스트 전용 여부' })
  @IsOptional()
  @IsBoolean()
  isAllowlistOnly?: boolean;

  @ApiPropertyOptional({ description: 'Max Total Usage (0 = unlimited) / 전체 최대 사용 횟수' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxUsage?: number;

  @ApiPropertyOptional({ description: 'Max Usage Per User / 유저당 최대 사용 횟수' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ description: 'Start Date / 시작 일시' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @ApiPropertyOptional({ description: 'Expiry Date / 만료 일시' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}

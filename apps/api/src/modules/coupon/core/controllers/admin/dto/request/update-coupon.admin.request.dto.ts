import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsDate, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import type { CouponMetadata } from '../../../../domain/coupon.entity';

export class UpdateCouponAdminRequestDto {
  @ApiPropertyOptional({
    description: 'Coupon Metadata (Titles, Descriptions, UI settings)',
    type: 'object',
    additionalProperties: true,
    example: {
      title: { ko: '신규 가입 쿠폰', en: 'New Member Coupon' },
      description: { ko: '신규 가입자 전용 KRW 10,000 쿠폰', en: '10,000 KRW Coupon for new members' },
      display: { color: '#FF0000', icon: 'gift', imageUrl: 'https://example.com/coupon.png' },
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: CouponMetadata;

  @ApiPropertyOptional({ description: 'Total max usage global (0 for unlimited)', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxUsage?: number;

  @ApiPropertyOptional({ description: 'Max usage per individual user', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ description: 'Coupon validity start date', example: '2024-03-18T00:00:00Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startsAt?: Date;

  @ApiPropertyOptional({ description: 'Coupon validity end date', example: '2024-04-18T23:59:59Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;
}

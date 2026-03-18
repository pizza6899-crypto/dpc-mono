import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RewardItemType, ExchangeCurrencyCode } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, ValidateNested, IsDate, Min, IsObject, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import type { CouponMetadata } from '../../../../domain/coupon.entity';

export class CreateCouponRewardAdminRequestDto {
  @ApiProperty({ enum: RewardItemType, description: 'Reward Type' })
  @IsEnum(RewardItemType)
  rewardType: RewardItemType;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code' })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Reward amount', example: 1000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Wagering multiplier (e.g. 30 for 30x)', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  wageringMultiplier?: number;

  @ApiPropertyOptional({ description: 'Max cash conversion amount', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCashConversion?: number;
}

export class CreateCouponAdminRequestDto {
  @ApiProperty({ description: 'Unique Coupon Code', example: 'GIFT2024-TEST' })
  @IsString()
  @IsNotEmpty()
  code: string;

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

  @ApiPropertyOptional({ description: 'If only allowlisted users can use', example: false })
  @IsOptional()
  @IsBoolean()
  isAllowlistOnly?: boolean;

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

  @ApiProperty({ type: [CreateCouponRewardAdminRequestDto], description: 'Rewards given on redemption' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateCouponRewardAdminRequestDto)
  rewards: CreateCouponRewardAdminRequestDto[];
}

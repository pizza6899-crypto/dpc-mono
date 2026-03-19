import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDate,
  ValidateNested,
  IsObject,
  IsNumberString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExchangeCurrencyCode, RewardItemType } from '@prisma/client';
import { CouponMetadata } from '../../../../domain/coupon.types';

export class CouponRewardRequestDto {
  @ApiProperty({
    enum: RewardItemType,
    description: 'Reward Item Type / 보상 아이템 타입',
  })
  @IsEnum(RewardItemType)
  rewardType: RewardItemType;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency / 통화' })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Reward Amount / 보상 금액 (String)' })
  @IsNumberString()
  amount: string;

  @ApiPropertyOptional({
    description: 'Wagering Multiplier / 롤링 배수 (String)',
  })
  @IsOptional()
  @IsNumberString()
  wageringMultiplier?: string;

  @ApiPropertyOptional({
    description: 'Max Cash Conversion / 최대 현금 전환액 (String)',
  })
  @IsOptional()
  @IsNumberString()
  maxCashConversion?: string;
}

export class CreateAdminCouponRequestDto {
  @ApiProperty({ description: 'Coupon Code / 쿠폰 코드', example: 'GIFT-1000' })
  @IsString()
  code: string;

  @ApiProperty({
    description:
      'Coupon Metadata (i18n title/desc) / 쿠폰 메타데이터 (다국어 지칭 등)',
  })
  @IsObject()
  metadata: CouponMetadata;

  @ApiPropertyOptional({
    description: 'Is Allowlist Only / 허용 리스트 전용 여부',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAllowlistOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Max Total Usage (0 = unlimited) / 전체 최대 사용 횟수',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxUsage?: number;

  @ApiPropertyOptional({
    description: 'Max Usage Per User / 유저당 최대 사용 횟수',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxUsagePerUser?: number;

  @ApiPropertyOptional({ description: 'Start Date / 시작일시' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @ApiPropertyOptional({ description: 'Expiry Date / 만료일시' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiProperty({
    type: [CouponRewardRequestDto],
    description: 'Rewards / 지급 보상 리스트',
  })
  @ValidateNested({ each: true })
  @Type(() => CouponRewardRequestDto)
  rewards: CouponRewardRequestDto[];
}

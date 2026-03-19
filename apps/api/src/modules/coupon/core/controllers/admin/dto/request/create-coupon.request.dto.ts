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
    example: RewardItemType.BONUS_MONEY,
  })
  @IsEnum(RewardItemType)
  rewardType: RewardItemType;

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Currency / 통화',
    example: ExchangeCurrencyCode.USDT,
  })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Reward Amount / 보상 금액 (String)',
    example: '1000',
  })
  @IsString()
  amount: string;

  @ApiPropertyOptional({
    description: 'Wagering Multiplier / 롤링 배수 (String)',
    example: '1',
  })
  @IsOptional()
  @IsString()
  wageringMultiplier?: string;

  @ApiPropertyOptional({
    description: 'Max Cash Conversion / 최대 현금 전환액 (String)',
    example: '0',
  })
  @IsOptional()
  @IsString()
  maxCashConversion?: string;
}

export class CreateAdminCouponRequestDto {
  @ApiProperty({ description: 'Coupon Code / 쿠폰 코드', example: 'GIFT-1000' })
  @IsString()
  code: string;

  @ApiProperty({
    type: CouponMetadata,
    description:
      'Coupon Metadata (i18n title/desc) / 쿠폰 메타데이터 (다국어 지칭 등)',
    example: {
      title: { EN: 'Welcome Bonus', KO: '가입 환영 쿠폰' },
      description: {
        EN: 'Reward for new users',
        KO: '신규 유저를 위한 보너스 쿠폰입니다.',
      },
    },
  })
  @IsObject()
  @ValidateNested()
  @Type(() => CouponMetadata)
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
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  maxUsage?: number;

  @ApiPropertyOptional({
    description: 'Max Usage Per User / 유저당 최대 사용 횟수',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  maxUsagePerUser?: number;

  @ApiPropertyOptional({
    description: 'Start Date / 시작일시',
    example: '2026-03-19T00:00:00.000Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAt?: Date;

  @ApiPropertyOptional({
    description: 'Expiry Date / 만료일시',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiProperty({
    type: [CouponRewardRequestDto],
    description: 'Rewards / 지급 보상 리스트',
    example: [
      {
        rewardType: RewardItemType.BONUS_MONEY,
        currency: ExchangeCurrencyCode.USDT,
        amount: '1000',
        wageringMultiplier: '1',
      },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => CouponRewardRequestDto)
  rewards: CouponRewardRequestDto[];
}

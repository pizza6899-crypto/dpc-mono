import { ApiProperty } from '@nestjs/swagger';
import { CouponStatus, RewardItemType, ExchangeCurrencyCode } from '@prisma/client';
import type { CouponMetadata } from '../../../../domain/coupon.entity';

export class CouponRewardAdminResponseDto {
  @ApiProperty({ description: 'Reward ID', example: '1' })
  id: string;

  @ApiProperty({ enum: RewardItemType, description: 'Reward Type' })
  rewardType: RewardItemType;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency Code' })
  currency: ExchangeCurrencyCode;

  @ApiProperty({ description: 'Reward amount', example: 1000 })
  amount: number;

  @ApiProperty({ description: 'Wagering multiplier', example: 30, nullable: true })
  wageringMultiplier: number | null;

  @ApiProperty({ description: 'Max cash conversion', example: 5000, nullable: true })
  maxCashConversion: number | null;
}

export class CouponAdminResponseDto {
  @ApiProperty({ description: 'Coupon ID', example: '1' })
  id: string;

  @ApiProperty({ description: 'Coupon Code', example: 'GIFT2024' })
  code: string;

  @ApiProperty({
    description: 'Coupon Metadata (Titles, Descriptions, UI settings)',
    type: 'object',
    additionalProperties: true,
    example: {
      title: { ko: '신규 가입 쿠폰', en: 'New Member Coupon' },
      description: { ko: '신규 가입자 전용 KRW 10,000 쿠폰', en: '10,000 KRW Coupon for new members' },
      display: { color: '#FF0000', icon: 'gift', imageUrl: 'https://example.com/coupon.png' },
    },
  })
  metadata: CouponMetadata | null;

  @ApiProperty({ description: 'Is Allowlist Only', example: false })
  isAllowlistOnly: boolean;

  @ApiProperty({ description: 'Global Max Usage (0=unlimited)', example: 100 })
  maxUsage: number;

  @ApiProperty({ description: 'Current total usage count', example: 5 })
  usageCount: number;

  @ApiProperty({ description: 'Max usage per user', example: 1 })
  maxUsagePerUser: number;

  @ApiProperty({ enum: CouponStatus, description: 'Coupon Status' })
  status: CouponStatus;

  @ApiProperty({ description: 'Validity start date', nullable: true })
  startsAt: Date | null;

  @ApiProperty({ description: 'Validity end date', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;

  @ApiProperty({ type: [CouponRewardAdminResponseDto] })
  rewards: CouponRewardAdminResponseDto[];
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CouponStatus, ExchangeCurrencyCode, RewardItemType } from '@prisma/client';
import { CouponMetadata } from '../../../../domain/coupon.types';

export class CouponRewardResponseDto {
  @ApiProperty({ enum: RewardItemType, description: 'Reward Item Type / 보상 아이템 타입' })
  rewardType: RewardItemType;

  @ApiProperty({ enum: ExchangeCurrencyCode, description: 'Currency / 통화' })
  currency: ExchangeCurrencyCode;

  @ApiProperty({ example: '1000', description: 'Amount / 보상 금액' })
  amount: string;

  @ApiPropertyOptional({ example: '1', description: 'Wagering Multiplier / 롤링 배수' })
  wageringMultiplier: string | null;

  @ApiPropertyOptional({ example: '10000', description: 'Max Cash Conversion / 최대 현금 전환액' })
  maxCashConversion: string | null;
}

export class CouponResponseDto {
  @ApiProperty({ example: '123456789012345678', description: 'Coupon ID / 쿠폰 ID' })
  id: string;

  @ApiProperty({ example: 'GIFT-1000', description: 'Coupon Code / 쿠폰 코드' })
  code: string;

  @ApiProperty({ description: 'Coupon Metadata (i18n) / 쿠폰 메타데이터 (다국어)' })
  metadata: CouponMetadata | null;

  @ApiProperty({ description: 'Is Allowlist Only / 허용 리스트 전용 여부' })
  isAllowlistOnly: boolean;

  @ApiProperty({ description: 'Max Total Usage / 전체 최대 사용 가능 횟수' })
  maxUsage: number;

  @ApiProperty({ description: 'Current Usage Count / 현재 사용된 횟수' })
  usageCount: number;

  @ApiProperty({ description: 'Max Usage Per User / 유저당 최대 사용 가능 횟수' })
  maxUsagePerUser: number;

  @ApiProperty({ enum: CouponStatus, description: 'Coupon Status / 쿠폰 상태' })
  status: CouponStatus;

  @ApiPropertyOptional({ description: 'Start Date / 시작일' })
  startsAt: Date | null;

  @ApiPropertyOptional({ description: 'Expiry Date / 만료일' })
  expiresAt: Date | null;

  @ApiProperty({ type: [CouponRewardResponseDto], description: 'Rewards / 보상 목록' })
  rewards: CouponRewardResponseDto[];

  @ApiPropertyOptional({ example: '123456789012345678', description: 'Created By (Admin ID) / 생성자 ID' })
  createdBy: string | null;

  @ApiPropertyOptional({ example: '123456789012345678', description: 'Updated By (Admin ID) / 수정자 ID' })
  updatedBy: string | null;

  @ApiProperty({ description: 'Created At / 생성일' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated At / 수정일' })
  updatedAt: Date;
}

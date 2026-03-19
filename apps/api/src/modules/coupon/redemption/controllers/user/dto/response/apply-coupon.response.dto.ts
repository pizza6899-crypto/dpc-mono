import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode, RewardItemType } from '@prisma/client';
import { CouponMetadata } from '../../../../../core/domain/coupon.types';

export class ApplyCouponRewardResponseDto {
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

export class ApplyCouponResponseDto {
  @ApiProperty({ example: 'GIFT-1000', description: 'Coupon Code / 쿠폰 코드' })
  code: string;

  @ApiProperty({
    description: 'Coupon Metadata (i18n) / 쿠폰 메타데이터 (다국어)',
    example: { title: 'Welcome Bonus', description: 'Bonus for new users' }
  })
  metadata: CouponMetadata | null;

  @ApiProperty({
    type: [ApplyCouponRewardResponseDto],
    description: 'Rewards received from the coupon / 쿠폰을 통해 지급된 보상 목록'
  })
  rewards: ApplyCouponRewardResponseDto[];

  @ApiProperty({
    example: 'Coupon successfully applied',
    description: 'Success message / 처리 결과 메시지'
  })
  message: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExchangeCurrencyCode, RewardItemType } from '@prisma/client';

export class ApplyCouponRewardResponseDto {
  @ApiProperty({
    enum: RewardItemType,
    description: 'Reward Item Type / 보상 아이템 타입',
    example: RewardItemType.BONUS_MONEY,
  })
  rewardType: RewardItemType;

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Currency / 통화',
    example: ExchangeCurrencyCode.USDT,
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    example: '1000',
    description: 'Reward Amount / 보상 금액',
  })
  amount: string;

  @ApiPropertyOptional({
    example: '1',
    description: 'Wagering Multiplier (Rollover) / 롤링 배수',
  })
  wageringMultiplier: string | null;

  @ApiPropertyOptional({
    example: '10000',
    description: 'Max Cash Conversion / 최대 현금 전환액',
  })
  maxCashConversion: string | null;
}

export class ApplyCouponResponseDto {
  @ApiProperty({
    type: [ApplyCouponRewardResponseDto],
    description:
      'Rewards received from the coupon / 쿠폰 적용으로 지급된 보상 목록',
  })
  rewards: ApplyCouponRewardResponseDto[];
}

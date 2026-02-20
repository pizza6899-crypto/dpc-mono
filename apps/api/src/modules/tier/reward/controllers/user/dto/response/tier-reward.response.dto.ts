import { ApiProperty } from '@nestjs/swagger';

export class TierRewardResponseDto {
  @ApiProperty({ description: 'Reward ID (SQID) / 보상 ID (SQID)' })
  id: string;

  @ApiProperty({ description: 'Tier Name / 티어명' })
  tierName: string;

  @ApiProperty({ description: 'Bonus Amount (USD) / 보너스 금액 (USD)' })
  amount: string;

  @ApiProperty({ description: 'Currency / 통화', example: 'USD' })
  currency: string;

  @ApiProperty({
    description: 'Wagering Requirement Multiplier / 베팅 조건 배율',
  })
  wageringMultiplier: string;

  @ApiProperty({ description: 'Expiration Date / 만료 일시', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({ description: 'Creation Date / 생성 일시' })
  createdAt: Date;
}

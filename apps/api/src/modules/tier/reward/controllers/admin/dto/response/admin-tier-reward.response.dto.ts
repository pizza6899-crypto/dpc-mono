import { ApiProperty } from '@nestjs/swagger';
import { TierUpgradeRewardStatus } from '@prisma/client';

export class AdminTierRewardResponseDto {
  @ApiProperty({ description: 'Reward ID / 보상 ID' })
  id: string;

  @ApiProperty({ description: 'User ID / 유저 ID' })
  userId: string;

  @ApiProperty({ description: 'Tier Name / 티어명' })
  tierName: string;

  @ApiProperty({ description: 'From Level / 이전 레벨' })
  fromLevel: number;

  @ApiProperty({ description: 'To Level / 달성 레벨' })
  toLevel: number;

  @ApiProperty({ description: 'Bonus Amount (USD) / 보너스 금액 (USD)' })
  amount: string;

  @ApiProperty({ description: 'Wagering Multiplier / 웨이저링 배율' })
  wageringMultiplier: string;

  @ApiProperty({ description: 'Status / 상태', enum: TierUpgradeRewardStatus })
  status: TierUpgradeRewardStatus;

  @ApiProperty({ description: 'Created At / 생성일시' })
  createdAt: Date;

  @ApiProperty({
    description: 'Claimed At / 수령일시',
    required: false,
    nullable: true,
  })
  claimedAt: Date | null;

  @ApiProperty({
    description: 'Expires At / 만료일시',
    required: false,
    nullable: true,
  })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Cancelled At / 취소일시',
    required: false,
    nullable: true,
  })
  cancelledAt: Date | null;

  @ApiProperty({
    description: 'Cancel Reason / 취소 사유',
    required: false,
    nullable: true,
  })
  cancelReason: string | null;
}

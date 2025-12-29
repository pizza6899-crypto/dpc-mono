import { ApiProperty } from '@nestjs/swagger';

export class VipMembershipResponseDto {
  @ApiProperty({ description: '사용자 ID' })
  userId: bigint;

  @ApiProperty({ description: '현재 VIP 레벨' })
  currentLevel: {
    nameKey: string;
    rank: number;
  };

  @ApiProperty({ description: '누적 롤링' })
  accumulatedRolling: number;

  @ApiProperty({ description: '레벨 달성일' })
  achievedAt: Date | null;

  @ApiProperty({ description: '다음 레벨까지 필요한 롤링' })
  nextLevelRequiredRolling: number;

  @ApiProperty({ description: '다음 레벨 정보' })
  nextLevel?: {
    nameKey: string;
    rank: number;
  };
}

export class VipHistoryResponseDto {
  @ApiProperty({ description: '이전 레벨 nameKey' })
  previousLevelNameKey: string | null;

  @ApiProperty({ description: '새 레벨 nameKey' })
  newLevelNameKey: string;

  @ApiProperty({ description: '보상 금액' })
  rewardAmount: number;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;
}

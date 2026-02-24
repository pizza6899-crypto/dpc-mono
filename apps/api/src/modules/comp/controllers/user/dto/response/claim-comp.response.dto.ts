import { ApiProperty } from '@nestjs/swagger';

export class ClaimCompResponseDto {
  @ApiProperty({
    description: 'Claimed amount as cash / 현금으로 전환된 금액',
    example: '1000.00',
  })
  claimedAmount: string;

  @ApiProperty({
    description: 'Remaining comp points balance / 전환 후 남은 콤프 잔액',
    example: '500.50',
  })
  newCompBalance: string;

  @ApiProperty({
    description: 'Granted Reward ID (Sqid) / 발급된 리워드(쿠폰) 식별자',
    example: 'r_abc123',
  })
  rewardId: string;
}

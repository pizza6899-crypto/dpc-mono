import type { ExchangeCurrencyCode, WageringStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class WageringRequirementUserResponseDto {
  @ApiProperty({
    description: 'Requirement ID (Sqid) / 요구사항 ID (난독화됨)',
  })
  id: string;


  @ApiProperty({ description: 'Currency / 통화' })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Principal Amount / 원금 (보너스 지급의 기준이 된 금액)',
    example: '10000',
  })
  principalAmount: string;

  @ApiProperty({
    description: 'Wagering Multiplier / 롤링 배수',
    example: '10',
  })
  multiplier: number;

  @ApiProperty({ description: 'Target Type / 목표 타입 (금액 or 횟수)' })
  targetType: string;

  @ApiProperty({
    description: 'Required Amount / 총 요구 롤링 금액',
    example: '100000',
  })
  requiredAmount: string;

  @ApiProperty({
    description: 'Wagered Amount / 현재까지 베팅한(기여된) 롤링 금액',
    example: '50000',
  })
  wageredAmount: string;

  @ApiProperty({
    description: 'Remaining Amount / 남은 롤링 금액',
    example: '50000',
  })
  remainingAmount: string;

  @ApiProperty({
    description: 'Required Count / 총 요구 게임 판수 (횟수 롤링 전용)',
    example: 10,
  })
  requiredCount: number;

  @ApiProperty({
    description: 'Wagered Count / 현재까지 베팅한 게임 판수',
    example: 5,
  })
  wageredCount: number;

  @ApiProperty({ description: 'Remaining Count / 남은 게임 판수', example: 5 })
  remainingCount: number;

  @ApiProperty({ description: 'Progress Rate (0-100) / 달성률', example: 50 })
  progressRate: number;

  @ApiProperty({ description: 'Status / 상태' })
  status: WageringStatus;

  @ApiProperty({ description: 'Expires At / 만료 예정일', nullable: true })
  expiresAt: Date | null;

  @ApiProperty({
    description: 'Accumulated Bet Amount / 필터 적용 전 총 배팅 금액',
    example: '120000',
  })
  accumulatedBetAmount: string;

  @ApiProperty({ description: 'Created At / 생성일' })
  createdAt: Date;
}

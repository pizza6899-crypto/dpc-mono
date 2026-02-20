import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class WageringSummaryUserResponseDto {
  @ApiProperty({ description: 'Currency / 통화' })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description:
      'Total number of active requirements / 진행 중인 총 롤링 조건 수',
    example: 2,
  })
  activeCount: number;

  @ApiProperty({
    description: 'Total remaining wagering amount / 총 남은 롤링 금액',
    example: '50000',
  })
  totalRemainingAmount: string;

  @ApiProperty({
    description: 'Total required wagering amount / 총 요구 롤링 금액',
    example: '100000',
  })
  totalRequiredAmount: string;

  @ApiProperty({
    description: 'Overall progress rate (0-100) / 전체 달성률',
    example: 50,
  })
  totalProgressRate: number;

  @ApiProperty({
    description: 'Is withdrawal restricted / 현재 출금 제한 여부',
    example: true,
  })
  isWithdrawalRestricted: boolean;

  @ApiProperty({
    description: 'Last contribution date / 마지막 기여 발생일',
    nullable: true,
  })
  lastContributedAt: Date | null;
}

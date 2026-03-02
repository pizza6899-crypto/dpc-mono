import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class WithdrawalEligibilityResponseDto {
  @ApiProperty({ description: 'Currency / 통화', enum: ExchangeCurrencyCode })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Final withdrawable amount / 최종 출금 가능 한도',
    example: '0.00',
  })
  withdrawableAmount: string;
}

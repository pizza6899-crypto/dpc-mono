import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@prisma/client';

export class CompBalanceResponseDto {
  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Currency code / 통화 코드',
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Current balance / 현재 잔액',
    example: '1000.50',
  })
  balance: string;

  @ApiProperty({
    description: 'Total earned comp points / 총 적립 콤프',
    example: '5000.00',
  })
  totalEarned: string;
}

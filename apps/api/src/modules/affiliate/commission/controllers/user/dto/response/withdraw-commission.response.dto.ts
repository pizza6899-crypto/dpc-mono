// src/modules/affiliate/commission/controllers/user/dto/response/withdraw-commission.response.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { ExchangeCurrencyCode } from '@repo/database';

export class WithdrawCommissionResponseDto {
  @ApiProperty({
    description: '통화',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '출금 가능 잔액 (출금 후)',
    example: '900.00',
    type: String,
  })
  availableBalance: string;

  @ApiProperty({
    description: '대기 중인 커미션',
    example: '500.00',
    type: String,
  })
  pendingBalance: string;

  @ApiProperty({
    description: '총 적립 커미션',
    example: '1500.00',
    type: String,
  })
  totalEarned: string;
}

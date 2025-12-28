// src/modules/affiliate/commission/controllers/dto/request/withdraw-commission.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { ExchangeCurrencyCode } from '@repo/database';

export class WithdrawCommissionDto {
  @ApiProperty({
    description: '출금할 통화',
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.USD,
  })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '출금할 금액 (소수점 포함 가능, 예: "100.50")',
    example: '100.50',
    pattern: '^\\d+(\\.\\d{1,2})?$',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message:
      'Amount must be a valid decimal number with up to 2 decimal places',
  })
  amount: string;
}

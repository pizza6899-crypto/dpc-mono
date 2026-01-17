// src/modules/wallet/controllers/user/dto/request/get-balance-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from 'src/generated/prisma';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

export class GetBalanceQueryDto {
  @ApiPropertyOptional({
    description: '통화 코드 (지정하지 않으면 모든 통화의 잔액을 반환)',
    enum: WALLET_CURRENCIES,
    example: 'USD',
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode, {
    message: 'Invalid currency code',
  })
  currency?: ExchangeCurrencyCode;
}


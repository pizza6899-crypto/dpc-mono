import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn } from 'class-validator';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';
import type { WalletCurrencyCode } from 'src/utils/currency.util';

export class GetUserBalanceQueryDto {
  @ApiPropertyOptional({
    description: '통화 코드 (지정하지 않으면 모든 통화의 잔액을 반환)',
    enum: WALLET_CURRENCIES,
  })
  @IsOptional()
  @IsIn(WALLET_CURRENCIES, {
    message:
      'Invalid currency code. Allowed values: ' + WALLET_CURRENCIES.join(', '),
  })
  currency?: WalletCurrencyCode;
}

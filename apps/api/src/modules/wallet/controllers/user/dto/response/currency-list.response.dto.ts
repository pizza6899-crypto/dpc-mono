import { ApiProperty } from '@nestjs/swagger';
import { WALLET_CURRENCIES, WalletCurrencyCode } from 'src/utils/currency.util';

export class CurrencyListResponseDto {
  @ApiProperty({
    description: 'Supported currencies / 지원하는 통화 목록',
    enum: WALLET_CURRENCIES,
    isArray: true,
    example: ['USDT', 'KRW'],
  })
  currencies: WalletCurrencyCode[];
}

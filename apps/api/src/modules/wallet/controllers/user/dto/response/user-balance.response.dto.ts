// src/modules/wallet/controllers/user/dto/response/user-balance.response.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ExchangeCurrencyCode } from '@prisma/client';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

export class UserBalanceItemDto {
  @ApiProperty({
    description: '통화',
    enum: WALLET_CURRENCIES,
    example: 'USD',
  })
  currency: ExchangeCurrencyCode;

  @ApiProperty({
    description: '메인 잔액',
    example: '1000.00',
    type: String,
  })
  mainBalance: string;

  @ApiProperty({
    description: '보너스 잔액',
    example: '500.00',
    type: String,
  })
  bonusBalance: string;

  @ApiProperty({
    description: '총 잔액 (메인 + 보너스)',
    example: '1500.00',
    type: String,
  })
  totalBalance: string;
}

export class UserBalanceResponseDto {
  @ApiProperty({
    description: '사용자 잔액 정보',
    type: [UserBalanceItemDto],
  })
  wallets: UserBalanceItemDto[];
}


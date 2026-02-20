import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsIn } from 'class-validator';
import { ExchangeCurrencyCode, UserWalletStatus } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/http/types/pagination.types';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

export class AdminFindWalletsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'User ID / 사용자 ID', example: '1' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    enum: WALLET_CURRENCIES,
    description: 'Currency Code / 통화 코드',
  })
  @IsOptional()
  @IsIn(WALLET_CURRENCIES, {
    message:
      'Invalid currency code. Allowed values: ' + WALLET_CURRENCIES.join(', '),
  })
  currency?: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    enum: UserWalletStatus,
    description: 'Wallet Status / 지갑 상태',
  })
  @IsOptional()
  @IsEnum(UserWalletStatus)
  status?: UserWalletStatus;
}

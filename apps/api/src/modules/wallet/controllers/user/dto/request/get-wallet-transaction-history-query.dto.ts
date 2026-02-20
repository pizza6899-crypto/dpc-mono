import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  IsIn,
} from 'class-validator';
import {
  ExchangeCurrencyCode,
  UserWalletTransactionType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import { WALLET_CURRENCIES } from 'src/utils/currency.util';

export class GetUserWalletTransactionHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Currency code / 통화 코드',
    enum: WALLET_CURRENCIES,
  })
  @IsOptional()
  @IsIn(WALLET_CURRENCIES, {
    message: 'Invalid currency code',
  })
  currency?: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    description: 'Transaction type / 트랜잭션 타입',
    enum: UserWalletTransactionType,
  })
  @IsOptional()
  @IsEnum(UserWalletTransactionType)
  type?: UserWalletTransactionType;

  @ApiPropertyOptional({
    description: 'Start date / 조회 시작일 (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date / 조회 종료일 (ISO 8601)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Page number / 페이지 번호 (1-based)',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Page size / 페이지 크기',
    minimum: 1,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

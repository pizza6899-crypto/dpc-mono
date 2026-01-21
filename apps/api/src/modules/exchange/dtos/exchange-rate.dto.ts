import { ExchangeCurrencyCode } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsNumberString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExchangeQuoteQueryDto {
  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Source currency code / 기준 통화 코드',
  })
  @IsEnum(ExchangeCurrencyCode)
  from: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    isArray: true,
    enum: ExchangeCurrencyCode,
    description:
      'Target currency codes / 대상 통화 코드 배열 (없으면 전체 통화 기준)',
  })
  @IsOptional()
  @IsArray()
  @Type(() => String)
  @IsEnum(ExchangeCurrencyCode, { each: true })
  to?: ExchangeCurrencyCode[];
}

export class ExchangeQuoteItemDto {
  @ApiProperty({ enum: ExchangeCurrencyCode })
  from: ExchangeCurrencyCode;

  @ApiProperty({ enum: ExchangeCurrencyCode })
  to: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Exchange rate (from -> to, Decimal as string)',
    example: '1320.123456',
  })
  rate: string;
}

export class ConvertCurrencyQueryDto {
  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Source currency code / 기준 통화 코드',
  })
  @IsEnum(ExchangeCurrencyCode)
  from: ExchangeCurrencyCode;

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Target currency code / 대상 통화 코드',
  })
  @IsEnum(ExchangeCurrencyCode)
  to: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Amount to convert (string with decimal) / 변환할 금액',
    example: '100.5',
  })
  @IsNumberString()
  amount: string;
}

export class ConvertCurrencyResponseDto {
  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Source currency code / 기준 통화 코드',
  })
  from: ExchangeCurrencyCode;

  @ApiProperty({
    enum: ExchangeCurrencyCode,
    description: 'Target currency code / 대상 통화 코드',
  })
  to: ExchangeCurrencyCode;

  @ApiProperty({
    description: 'Requested amount (Decimal as string) / 요청 금액',
    example: '100.5',
  })
  amount: string;

  @ApiProperty({
    description: 'Exchange rate (from -> to, Decimal as string)',
    example: '11.29228753',
  })
  rate: string;

  @ApiProperty({
    description: 'Converted amount (Decimal as string)',
    example: '124.21516283',
  })
  convertedAmount: string;
}

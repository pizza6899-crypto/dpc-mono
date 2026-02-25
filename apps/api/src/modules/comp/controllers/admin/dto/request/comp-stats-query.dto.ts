import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';

export class CompStatsQueryDto {
  @ApiProperty({
    enum: ExchangeCurrencyCode,
    example: ExchangeCurrencyCode.KRW,
    description: 'Currency to filter by / 필터링할 통화',
  })
  @IsEnum(ExchangeCurrencyCode)
  currency: ExchangeCurrencyCode;

  @ApiProperty({ example: '2024-01-01', required: false, description: 'Start date (ISO 8601) / 검색 시작일' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ example: '2024-01-31', required: false, description: 'End date (ISO 8601) / 검색 종료일' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

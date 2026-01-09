import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@repo/database';

export class FindStatsRequestDto {
    @IsDateString()
    @IsOptional()
    @ApiProperty({ description: 'Start date (ISO string)', required: false, example: '2024-01-01T00:00:00Z' })
    startAt?: string;

    @IsDateString()
    @IsOptional()
    @ApiProperty({ description: 'End date (ISO string)', required: false, example: '2024-01-31T23:59:59Z' })
    endAt?: string;

    @IsEnum(ExchangeCurrencyCode)
    @IsOptional()
    @ApiProperty({ description: 'Currency code', required: false, enum: ['KRW', 'USD', 'JPY'] })
    currency?: ExchangeCurrencyCode;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from 'src/generated/prisma';

export class CompStatsQueryDto {
    @ApiProperty({ enum: ExchangeCurrencyCode, example: ExchangeCurrencyCode.KRW, required: false })
    @IsEnum(ExchangeCurrencyCode)
    @IsOptional()
    currency?: ExchangeCurrencyCode;

    @ApiProperty({ example: '2024-01-01', required: false })
    @IsOptional()
    startDate?: string;

    @ApiProperty({ example: '2024-01-31', required: false })
    @IsOptional()
    endDate?: string;
}

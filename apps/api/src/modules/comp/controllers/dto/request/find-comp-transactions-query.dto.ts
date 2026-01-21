import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ExchangeCurrencyCode } from '@prisma/client';
import { PaginationQueryDto } from 'src/common/http/types/pagination.types';

export class FindCompTransactionsQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({ enum: ExchangeCurrencyCode, description: 'Currency filter' })
    @IsOptional()
    @IsEnum(ExchangeCurrencyCode)
    currency?: ExchangeCurrencyCode;

    @ApiPropertyOptional({ description: 'Start Date (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'End Date (ISO 8601)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}

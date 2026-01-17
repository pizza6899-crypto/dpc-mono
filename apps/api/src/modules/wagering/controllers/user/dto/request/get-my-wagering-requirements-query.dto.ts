import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { WageringStatus, ExchangeCurrencyCode, WageringSourceType } from 'src/generated/prisma';
import { Transform } from 'class-transformer';

type WageringSortFields = 'createdAt' | 'updatedAt' | 'priority';

export class GetMyWageringRequirementsQueryDto extends createPaginationQueryDto<WageringSortFields>(
    {
        defaultLimit: 10,
        maxLimit: 50,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
    },
    ['createdAt', 'updatedAt', 'priority'],
) {
    @ApiPropertyOptional({
        description: 'Filter by Status (상태 필터, 여러 개일 경우 콤마로 구분)',
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED', 'VOIDED', 'EXPIRED'],
        isArray: true,
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') return value.split(',');
        return Array.isArray(value) ? value : [value];
    })
    @IsArray()
    @IsEnum(['ACTIVE', 'COMPLETED', 'CANCELLED', 'VOIDED', 'EXPIRED'], { each: true })
    statuses?: WageringStatus[];

    @ApiPropertyOptional({
        description: 'Currency Filter (통화 필터)',
        enum: ExchangeCurrencyCode,
    })
    @IsOptional()
    @IsEnum(ExchangeCurrencyCode)
    currency?: ExchangeCurrencyCode;

    @ApiPropertyOptional({
        description: 'Source Type Filter (소스 타입 필터)',
        enum: WageringSourceType,
    })
    @IsOptional()
    @IsEnum(WageringSourceType)
    sourceType?: WageringSourceType;

    @ApiPropertyOptional({
        description: 'From Date Filter (시작 날짜)',
        example: '2024-01-01T00:00:00Z',
    })
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : undefined)
    fromAt?: Date;

    @ApiPropertyOptional({
        description: 'To Date Filter (종료 날짜)',
        example: '2024-12-31T23:59:59Z',
    })
    @IsOptional()
    @Transform(({ value }) => value ? new Date(value) : undefined)
    toAt?: Date;
}

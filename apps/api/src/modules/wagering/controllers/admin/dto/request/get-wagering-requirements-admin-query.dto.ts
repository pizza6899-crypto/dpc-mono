import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsNumberString, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { WageringStatus } from '@repo/database';
import { Transform } from 'class-transformer';

type WageringSortFields = 'createdAt' | 'updatedAt' | 'priority' | 'id';

export class GetWageringRequirementsAdminQueryDto extends createPaginationQueryDto<WageringSortFields>(
    {
        defaultLimit: 20,
        maxLimit: 100,
        defaultSortBy: 'createdAt',
        defaultSortOrder: 'desc',
    },
    ['createdAt', 'updatedAt', 'priority', 'id'],
) {
    @ApiProperty({
        description: 'User ID Filter (유저 ID 필터)',
        example: '1234567890',
    })
    @IsNotEmpty()
    @IsNumberString()
    userId: string;

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
}

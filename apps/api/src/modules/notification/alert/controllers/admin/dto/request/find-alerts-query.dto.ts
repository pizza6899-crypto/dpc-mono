// apps/api/src/modules/notification/alert/controllers/admin/dto/request/find-alerts-query.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertStatus } from '@repo/database';

export class FindAlertsQueryDto {
    @ApiProperty({ description: 'Filter by status', enum: AlertStatus, required: false })
    @IsOptional()
    @IsEnum(AlertStatus)
    status?: AlertStatus;

    @ApiProperty({ description: 'Filter by event name', example: 'user.registered', required: false })
    @IsOptional()
    @IsString()
    event?: string;

    @ApiProperty({ description: 'Filter by user ID', example: '1234567890', required: false })
    @IsOptional()
    @Type(() => String)
    userId?: string;

    @ApiProperty({ description: 'Filter by start date', example: '2024-01-01T00:00:00Z', required: false })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({ description: 'Filter by end date', example: '2024-01-01T23:59:59Z', required: false })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiProperty({ description: 'Page number', example: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({ description: 'Items per page', example: 20, required: false })
    @IsOptional()
    @Type(() => Number)
    limit?: number = 20;
}

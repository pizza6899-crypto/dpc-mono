// apps/api/src/modules/notification/alert/controllers/admin/dto/request/find-alerts-query.dto.ts

import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { AlertStatus } from '@repo/database';

export class FindAlertsQueryDto {
    @IsOptional()
    @IsEnum(AlertStatus)
    status?: AlertStatus;

    @IsOptional()
    @IsString()
    event?: string;

    @IsOptional()
    @Type(() => String)
    userId?: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;

    @IsOptional()
    @Type(() => Number)
    skip?: number;

    @IsOptional()
    @Type(() => Number)
    take?: number;
}

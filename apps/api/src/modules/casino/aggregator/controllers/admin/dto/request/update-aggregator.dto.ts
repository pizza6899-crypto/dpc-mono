import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AggregatorStatus } from '@repo/database';
import type { AggregatorConfig } from '../../../../domain';

export class UpdateAggregatorDto {
    @ApiPropertyOptional({ description: '애그리게이터 이름' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: '애그리게이터 상태', enum: AggregatorStatus })
    @IsOptional()
    @IsEnum(AggregatorStatus)
    status?: AggregatorStatus;

    @ApiPropertyOptional({ description: '애그리게이터 설정 JSON' })
    @IsOptional()
    @IsObject()
    config?: AggregatorConfig;
}

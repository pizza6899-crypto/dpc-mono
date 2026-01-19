import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AggregatorStatus } from '@repo/database';

export class UpdateAggregatorDto {
    @ApiPropertyOptional({ description: 'Aggregator name / 애그리게이터 이름' })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({ description: 'Aggregator status / 애그리게이터 상태', enum: AggregatorStatus })
    @IsOptional()
    @IsEnum(AggregatorStatus)
    status?: AggregatorStatus;

    @ApiPropertyOptional({ description: 'API enabled / API 호출 활성 여부' })
    @IsOptional()
    @IsBoolean()
    apiEnabled?: boolean;
}

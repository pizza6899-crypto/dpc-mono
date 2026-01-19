import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FindGameProvidersRequestDto {
    @ApiPropertyOptional({ type: String, description: 'Filter by Aggregator ID / 어그리게이터 ID 필터링' })
    @IsOptional()
    @IsString()
    aggregatorId?: string;
}

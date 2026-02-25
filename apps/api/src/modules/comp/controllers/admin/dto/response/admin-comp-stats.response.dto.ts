import { ApiProperty } from '@nestjs/swagger';
import { CompOverviewResponseDto } from './comp-overview.response.dto';
import { CompDailyStatResponseDto } from './comp-daily-stat.response.dto';

export class AdminCompStatsResponseDto {
    @ApiProperty({ type: CompOverviewResponseDto })
    summary: CompOverviewResponseDto;

    @ApiProperty({ type: CompDailyStatResponseDto, isArray: true })
    daily: CompDailyStatResponseDto[];
}

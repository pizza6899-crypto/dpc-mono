import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SupportMessageHistoryUserRequestDto {
    @ApiPropertyOptional({ description: 'Limit / 가져올 개수', minimum: 1, maximum: 100, default: 50 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit: number = 50;

    @ApiPropertyOptional({ description: 'Last Message ID (Encoded) / 마지막으로 조회된 메시지 ID (커서 기반 페이지네이션)', example: 'cm_123' })
    @IsOptional()
    @IsString()
    lastMessageId?: string;
}

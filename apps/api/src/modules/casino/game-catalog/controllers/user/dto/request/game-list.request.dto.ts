import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GameListRequestDto {
    @ApiPropertyOptional({ description: 'Provider ID (Sqid or Raw ID)' })
    @IsOptional()
    @IsString()
    providerId?: string;

    @ApiPropertyOptional({ description: 'Category Code' })
    @IsOptional()
    @IsString()
    categoryCode?: string;

    @ApiPropertyOptional({ description: 'Search keyword' })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({ minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 30;
}

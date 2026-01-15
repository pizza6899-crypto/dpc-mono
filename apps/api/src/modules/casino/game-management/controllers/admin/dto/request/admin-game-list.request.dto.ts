import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { GameCategory, GameProvider, Language } from '@repo/database';

export class AdminGameListRequestDto {
    @ApiPropertyOptional({ enum: GameCategory, isArray: true })
    @IsOptional()
    @IsEnum(GameCategory, { each: true })
    category?: GameCategory[];

    @ApiPropertyOptional({ enum: GameProvider, isArray: true })
    @IsOptional()
    @IsEnum(GameProvider, { each: true })
    provider?: GameProvider[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number = 20;

    @ApiPropertyOptional({ enum: ['createdAt', 'name', 'categoryName'] })
    @IsOptional()
    @IsString()
    sortBy?: 'createdAt' | 'name' | 'categoryName' = 'createdAt';

    @ApiPropertyOptional({ enum: ['asc', 'desc'] })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc' = 'desc';

    @ApiPropertyOptional({ enum: Language })
    @IsOptional()
    @IsEnum(Language)
    language?: Language = Language.EN;

    @ApiPropertyOptional()
    @IsOptional()
    isEnabled?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    isVisibleToUser?: boolean;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@repo/database';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CategoryListRequestDto {
    @ApiPropertyOptional({ enum: Language, description: 'Language for translations' })
    @IsOptional()
    @IsEnum(Language)
    language?: Language;

    @ApiPropertyOptional({ minimum: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

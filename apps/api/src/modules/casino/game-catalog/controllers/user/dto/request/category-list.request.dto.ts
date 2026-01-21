import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class CategoryListRequestDto {
    @ApiPropertyOptional({ enum: Language, description: 'Language for translations (번역 언어)' })
    @IsOptional()
    @IsEnum(Language)
    language?: Language;

    @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number (페이지 번호)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20, description: 'Number of items per page (페이지 당 항목 수)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

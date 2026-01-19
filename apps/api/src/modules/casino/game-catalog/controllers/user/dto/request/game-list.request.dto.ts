import { ApiPropertyOptional } from '@nestjs/swagger';
import { Language } from '@repo/database';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GameListRequestDto {
    @ApiPropertyOptional({ enum: Language, description: 'Language for translations (번역 언어)' })
    @IsOptional()
    @IsEnum(Language)
    language?: Language;

    @ApiPropertyOptional({ description: 'Provider ID (Sqid or Raw ID) (프로바이더 아이디)' })
    @IsOptional()
    @IsString()
    providerId?: string;

    @ApiPropertyOptional({ description: 'Category Code (카테고리 코드)' })
    @IsOptional()
    @IsString()
    categoryCode?: string;

    @ApiPropertyOptional({ description: 'Search keyword (검색 키워드)' })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({ minimum: 1, default: 1, description: 'Page number (페이지 번호)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 30, description: 'Number of items per page (페이지 당 항목 수)' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 30;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType, Language } from '@repo/database';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CategoryTranslationRequestDto {
    @ApiProperty({ enum: Language })
    @IsNotEmpty()
    language: Language;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateCategoryAdminRequestDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ enum: CategoryType })
    @IsEnum(CategoryType)
    type: CategoryType = CategoryType.PRIMARY;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    iconUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    bannerUrl?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isSystem?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    autoPopulate?: boolean;

    @ApiProperty({ type: [CategoryTranslationRequestDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryTranslationRequestDto)
    translations: CategoryTranslationRequestDto[];
}

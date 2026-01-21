import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType, Language } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CategoryTranslationRequestDto {
    @ApiProperty({ enum: Language, description: 'Language code / 언어 코드' })
    @IsNotEmpty()
    language: Language;

    @ApiProperty({ description: 'Category name / 카테고리 이름' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({ description: 'Category description / 카테고리 설명' })
    @IsOptional()
    @IsString()
    description?: string;
}

export class CreateCategoryAdminRequestDto {
    @ApiProperty({ description: 'Category code (MUST BE UPPERCASE, e.g., SLOTS). Must be unique. / 카테고리 식별 코드 (반드시 대문자로 작성, 예: SLOTS). 중복 불가.' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({
        enum: CategoryType,
        description: 'Category type (PRIMARY: main games like slots, COLLECTION: marketing groups like trending) / 카테고리 타입 (PRIMARY: 슬롯/라이브 등 기본 카테고리, COLLECTION: 인기/추천 등 마케팅 그룹)'
    })
    @IsEnum(CategoryType)
    type: CategoryType = CategoryType.PRIMARY;

    @ApiPropertyOptional({ description: 'Icon file ID from file module / 파일 모듈에서 발급받은 아이콘 파일 ID' })
    @IsOptional()
    @IsString()
    iconFileId?: string;

    @ApiPropertyOptional({ description: 'Banner image file ID from file module / 파일 모듈에서 발급받은 배너 이미지 파일 ID' })
    @IsOptional()
    @IsString()
    bannerFileId?: string;

    @ApiPropertyOptional({ description: 'Sort order (lower values first) / 정렬 순서 (낮을수록 앞순위)' })
    @IsOptional()
    @IsNumber()
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'Activation status / 활성화 여부' })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ type: [CategoryTranslationRequestDto], description: 'List of translations / 번역 정보 목록' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryTranslationRequestDto)
    translations: CategoryTranslationRequestDto[];
}

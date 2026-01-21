import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType, Language } from '@prisma/client';

export class CategoryTranslationAdminResponseDto {
    @ApiProperty({ enum: Language, description: '언어 코드 / Language code' })
    language: Language;

    @ApiProperty({ description: '카테고리 이름 / Category name' })
    name: string;

    @ApiPropertyOptional({ description: '카테고리 설명 / Category description' })
    description?: string;
}

export class CategoryAdminResponseDto {
    @ApiProperty({ description: '내부 ID (숫자) / Internal ID (numeric)' })
    id: string;

    @ApiProperty({ description: '카테고리 코드 / Category Code' })
    code: string;

    @ApiProperty({ enum: CategoryType, description: '카테고리 타입 (PRIMARY, COLLECTION) / Category Type' })
    type: CategoryType;

    @ApiPropertyOptional({ description: '아이콘 URL / Icon URL' })
    iconUrl?: string;

    @ApiPropertyOptional({ description: '배너 URL / Banner URL' })
    bannerUrl?: string;

    @ApiProperty({ description: '정렬 순서 / Sort order' })
    sortOrder: number;

    @ApiProperty({ description: '활성화 여부 / Active status' })
    isActive: boolean;

    @ApiProperty({ description: '시스템 카테고리 여부 (삭제 불가) / System category flag' })
    isSystem: boolean;

    @ApiProperty({ type: [CategoryTranslationAdminResponseDto], description: '번역 정보 / Translations' })
    translations: CategoryTranslationAdminResponseDto[];
}


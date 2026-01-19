import { ApiProperty } from '@nestjs/swagger';
import { CategoryType, Language } from '@repo/database';

export class CategoryTranslationAdminResponseDto {
    @ApiProperty({ enum: Language })
    language: Language;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;
}

export class CategoryAdminResponseDto {
    @ApiProperty({ description: 'Internal ID' })
    id: string;

    @ApiProperty({ description: 'Category Code' })
    code: string;

    @ApiProperty({ enum: CategoryType })
    type: CategoryType;

    @ApiProperty({ required: false })
    iconUrl?: string;

    @ApiProperty({ required: false })
    bannerUrl?: string;

    @ApiProperty()
    sortOrder: number;

    @ApiProperty()
    isActive: boolean;

    @ApiProperty()
    isSystem: boolean;

    @ApiProperty({ type: [CategoryTranslationAdminResponseDto] })
    translations: CategoryTranslationAdminResponseDto[];
}

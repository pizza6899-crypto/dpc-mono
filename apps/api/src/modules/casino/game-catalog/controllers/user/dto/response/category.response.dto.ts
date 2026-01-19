import { ApiProperty } from '@nestjs/swagger';
import { CategoryType, Language } from '@repo/database';

export class CategoryTranslationResponseDto {
    @ApiProperty({ enum: Language })
    language: Language;

    @ApiProperty()
    name: string;

    @ApiProperty({ required: false })
    description?: string;
}

export class CategoryResponseDto {
    @ApiProperty({ description: 'Category Code' })
    code: string;

    @ApiProperty({ enum: CategoryType })
    type: CategoryType;

    @ApiProperty({ required: false })
    iconUrl?: string;

    @ApiProperty({ required: false })
    bannerUrl?: string;

    @ApiProperty({ type: [CategoryTranslationResponseDto] })
    translations: CategoryTranslationResponseDto[];
}

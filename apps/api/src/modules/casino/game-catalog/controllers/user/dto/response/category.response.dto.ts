import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@prisma/client';

export class CategoryResponseDto {
    @ApiProperty({ description: 'Category Code (카테고리 코드)' })
    code: string;

    @ApiProperty({ enum: CategoryType, description: 'Category Type (카테고리 타입)' })
    type: CategoryType;

    @ApiProperty({ description: 'Category name (localized) (카테고리 이름)' })
    name: string;

    @ApiPropertyOptional({ description: 'Category description (localized) (카테고리 설명)' })
    description?: string;

    @ApiPropertyOptional({ description: 'Icon URL (아이콘 URL)' })
    iconUrl?: string;

    @ApiPropertyOptional({ description: 'Banner URL (배너 URL)' })
    bannerUrl?: string;
}

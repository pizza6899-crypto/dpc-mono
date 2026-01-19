import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '@repo/database';

export class CategoryResponseDto {
    @ApiProperty({ description: 'Category Code' })
    code: string;

    @ApiProperty({ enum: CategoryType })
    type: CategoryType;

    @ApiProperty({ description: 'Category name (localized)' })
    name: string;

    @ApiPropertyOptional({ description: 'Category description (localized)' })
    description?: string;

    @ApiPropertyOptional()
    iconUrl?: string;

    @ApiPropertyOptional()
    bannerUrl?: string;
}

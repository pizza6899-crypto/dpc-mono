import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationQueryDto } from 'src/common/http/types/pagination.types';

export class FindForbiddenWordsAdminQueryDto extends PaginationQueryDto {
    @ApiPropertyOptional({
        description: 'Search keyword / 검색 키워드',
        example: 'badword'
    })
    @IsOptional()
    @IsString()
    keyword?: string;

    @ApiPropertyOptional({
        description: 'Filter by active status / 활성화 여부 필터',
        example: true
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    isActive?: boolean;
}

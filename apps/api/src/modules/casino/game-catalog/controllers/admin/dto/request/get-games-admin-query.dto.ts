import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'src/common/http/types';

export class GetGamesAdminQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by provider ID / 프로바이더 ID로 필터링',
  })
  @IsOptional()
  @IsString()
  providerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID / 카테고리 ID로 필터링',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by keyword / 키워드로 필터링' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Filter by isEnabled / 활성화 여부로 필터링',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by isVisible / 공개 여부로 필터링',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isVisible?: boolean;
}

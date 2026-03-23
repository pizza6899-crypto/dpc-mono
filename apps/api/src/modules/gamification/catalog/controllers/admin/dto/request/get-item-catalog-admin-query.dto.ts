import { ApiPropertyOptional } from '@nestjs/swagger';
import { ItemType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

/**
 * 아이템 카탈로그 어드민 조회 쿼리 DTO
 */
export class GetItemCatalogAdminQueryDto extends createPaginationQueryDto() {
  @ApiPropertyOptional({ enum: ItemType, description: 'Filter by Item Type / 아이템 타입 필터' })
  @IsOptional()
  @IsEnum(ItemType)
  type?: ItemType;

  @ApiPropertyOptional({ description: 'Filter by code or name / 코드 또는 이름 검색' })
  @IsOptional()
  @IsString()
  search?: string;
}

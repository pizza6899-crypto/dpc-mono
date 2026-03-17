// src/modules/promotion/campaign/controllers/user/dto/request/list-my-promotions-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

type UserPromotionSortFields = 'createdAt' | 'updatedAt' | 'id';

export class ListMyPromotionsQueryDto extends createPaginationQueryDto<UserPromotionSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'id'],
) {
  @ApiPropertyOptional({
    description: 'Promotion status filter / 프로모션 상태 필터',
    example: 'ACTIVE',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

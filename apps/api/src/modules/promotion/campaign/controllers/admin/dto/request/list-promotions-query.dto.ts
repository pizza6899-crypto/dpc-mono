import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { PromotionTargetType } from '@prisma/client';
import { TransformToBoolean } from 'src/common/http/decorators/transform-boolean.decorator';

type PromotionSortFields = 'createdAt' | 'updatedAt' | 'id';

export class ListPromotionsQueryDto extends createPaginationQueryDto<PromotionSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'id'],
) {
  @ApiPropertyOptional({
    description: 'Promotion ID filter / 프로모션 ID 필터',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Activation status filter / 활성화 여부 필터',
    example: true,
  })
  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Promotion target type filter / 프로모션 타겟 타입 필터',
    enum: PromotionTargetType,
  })
  @IsOptional()
  @IsEnum(PromotionTargetType)
  targetType?: PromotionTargetType;

  @ApiPropertyOptional({
    description: 'Start date (ISO 8601) - Based on creation / 시작 날짜 (ISO 8601 형식) - 생성일 기준',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (ISO 8601) - Based on creation / 종료 날짜 (ISO 8601 형식) - 생성일 기준',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

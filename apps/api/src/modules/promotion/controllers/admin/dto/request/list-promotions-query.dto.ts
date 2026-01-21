import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
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
    description: '활성화 여부 필터',
    example: true,
  })
  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '프로모션 타겟 타입 필터',
    enum: PromotionTargetType,
    example: PromotionTargetType.NEW_USER_FIRST_DEPOSIT,
  })
  @IsOptional()
  @IsEnum(PromotionTargetType)
  targetType?: PromotionTargetType;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601 형식) - 생성일 기준',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601 형식) - 생성일 기준',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}


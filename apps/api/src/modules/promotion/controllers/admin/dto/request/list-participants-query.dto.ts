// src/modules/promotion/controllers/admin/dto/request/list-participants-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { UserPromotionStatus } from '@repo/database';

export class ListParticipantsQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '페이지당 항목 수',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: '정렬 기준',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'id'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'updatedAt', 'id'])
  sortBy?: 'createdAt' | 'updatedAt' | 'id' = 'createdAt';

  @ApiPropertyOptional({
    description: '정렬 순서',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: '상태 필터',
    example: UserPromotionStatus.ACTIVE,
    enum: UserPromotionStatus,
  })
  @IsOptional()
  @IsEnum(UserPromotionStatus)
  status?: UserPromotionStatus;

  @ApiPropertyOptional({
    description: '사용자 ID 필터',
    example: '1234567890123456789',
    type: String,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}


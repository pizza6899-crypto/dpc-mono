import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactLogType } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

/**
 * [Artifact Audit Admin] 보너스 풀 로그 조회 쿼리 DTO
 */
type ArtifactBonusPoolLogSortFields = 'id' | 'createdAt';

export class GetArtifactBonusPoolLogAdminQueryDto extends createPaginationQueryDto<ArtifactBonusPoolLogSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['id', 'createdAt'],
) {
  @ApiPropertyOptional({ description: 'User ID / 유저 식별자' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Log Types Filter / 로그 타입 필터',
    enum: ArtifactLogType,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ArtifactLogType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  types?: ArtifactLogType[];

  @ApiPropertyOptional({ description: 'Start Date (ISO 8601) / 시작 시각' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO 8601) / 종료 시각' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

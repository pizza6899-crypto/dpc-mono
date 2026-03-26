import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade, ArtifactLogType } from '@prisma/client';
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
 * [Artifact Audit Admin] 유물 관련 활동 로그 조회 쿼리 DTO
 */
type UserArtifactLogSortFields = 'id' | 'createdAt';

export class GetUserArtifactLogAdminQueryDto extends createPaginationQueryDto<UserArtifactLogSortFields>(
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

  @ApiPropertyOptional({ description: 'Artifact ID / 유물 식별자' })
  @IsOptional()
  @IsString()
  artifactId?: string;

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

  @ApiPropertyOptional({
    description: 'Artifact Grade Filter / 유물 등급 필터',
    enum: ArtifactGrade,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ArtifactGrade, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  grades?: ArtifactGrade[];

  @ApiPropertyOptional({ description: 'Start Date (ISO 8601) / 시작 시각' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO 8601) / 종료 시각' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade, ArtifactCatalogStatus } from '@prisma/client';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { ArtifactCatalogSearchOptions } from '../../../../ports/artifact-catalog.repository.port';

/**
 * [Artifact Admin] 유물 카탈로그 목록 조회 쿼리 DTO
 */
type ArtifactCatalogSortFields =
  | 'id'
  | 'code'
  | 'grade'
  | 'drawWeight'
  | 'createdAt'
  | 'updatedAt';

export class GetArtifactCatalogAdminQueryDto extends createPaginationQueryDto<ArtifactCatalogSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['id', 'code', 'grade', 'drawWeight', 'createdAt', 'updatedAt'],
) implements ArtifactCatalogSearchOptions {
  @ApiPropertyOptional({
    description: 'Artifact Codes (Partial Match, Comma separated) / 유물 고유 코드 검색 (부분 일치, 콤마 구분 가능)',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Artifact Grade Filter List / 유물 등급 필터 목록 (다중 선택 가능)',
    enum: ArtifactGrade,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ArtifactGrade, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  grades?: ArtifactGrade[];

  @ApiPropertyOptional({
    description: 'Artifact Status Filter List / 유물 상태 필터 목록 (다중 선택 가능)',
    enum: ArtifactCatalogStatus,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ArtifactCatalogStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  statuses?: ArtifactCatalogStatus[];

  @ApiPropertyOptional({ description: 'Min Draw Weight / 최소 가중치' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minWeight?: number;

  @ApiPropertyOptional({ description: 'Max Draw Weight / 최대 가중치' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxWeight?: number;

  @ApiPropertyOptional({ description: 'Start Date (ISO 8601) / 시작 날짜 (등록일 기준)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO 8601) / 종료 날짜 (등록일 기준)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

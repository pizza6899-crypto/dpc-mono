import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';
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

  @ApiPropertyOptional({
    description: 'Benefit Types Filter / 혜택 종류 필터 (다중 선택 가능)',
    example: 'casinoBenefit,slotBenefit',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',')))
  benefitTypes?: string[];

  @ApiPropertyOptional({ description: 'Min Benefit Value / 최소 혜택 수치' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minBenefitValue?: number;

  @ApiPropertyOptional({ description: 'Start Date (ISO 8601) / 시작 날짜 (등록일 기준)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO 8601) / 종료 날짜 (등록일 기준)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

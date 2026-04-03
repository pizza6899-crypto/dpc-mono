import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsBoolean, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { Language } from '@prisma/client';
import { createPaginationQueryDto } from 'src/common/http/types';

export class AdminBannerListQueryDto extends createPaginationQueryDto({}, ['createdAt', 'updatedAt', 'id', 'order']) {
  @ApiPropertyOptional({ enum: Language, description: 'Language filter / 언어 필터' })
  @IsOptional()
  @IsEnum(Language)
  language?: Language;

  @ApiPropertyOptional({ description: 'Include soft-deleted records / 삭제된 레코드 포함', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeSoftDeleted: boolean = true;

  // `includeTime` removed — admin API no longer supports ad-hoc "now" filtering.

  @ApiPropertyOptional({ description: 'Active flag filter / 활성 여부 필터', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or translation title / 이름 또는 번역 제목으로 검색' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Start date from (ISO 8601) / 시작일 범위 시작' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Start date to (ISO 8601) / 시작일 범위 종료' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'End date from (ISO 8601) / 종료일 범위 시작' })
  @IsOptional()
  @IsDateString()
  endDateFrom?: string;

  @ApiPropertyOptional({ description: 'End date to (ISO 8601) / 종료일 범위 종료' })
  @IsOptional()
  @IsDateString()
  endDateTo?: string;
}

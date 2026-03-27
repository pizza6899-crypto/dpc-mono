import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArtifactGrade } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

/**
 * [Artifact Inventory] 내 보유 유물 목록 조회 쿼리 DTO
 */
type MyArtifactSortFields = 'id' | 'acquiredAt' | 'grade';

export class GetMyArtifactsQueryDto extends createPaginationQueryDto<MyArtifactSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 50,
    defaultSortBy: 'acquiredAt',
    defaultSortOrder: 'desc',
  },
  ['id', 'acquiredAt', 'grade'],
) {
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
}

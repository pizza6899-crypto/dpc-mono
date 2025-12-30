// src/modules/affiliate/code/controllers/admin/dto/request/find-codes-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { TransformToBoolean } from 'src/common/http/decorators/transform-boolean.decorator';

type CodeSortFields = 'createdAt' | 'updatedAt' | 'code';

export class FindCodesQueryDto extends createPaginationQueryDto<CodeSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'code'],
) {
  @ApiPropertyOptional({
    description: '사용자 ID 필터',
    example: '1234567890123456789',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  userId?: string;

  @ApiPropertyOptional({
    description: '코드 검색 (부분 일치)',
    example: 'SUMMER',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: '활성화 여부 필터',
    example: true,
  })
  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: '기본 코드 여부 필터',
    example: false,
  })
  @IsOptional()
  @TransformToBoolean()
  @IsBoolean()
  isDefault?: boolean;

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


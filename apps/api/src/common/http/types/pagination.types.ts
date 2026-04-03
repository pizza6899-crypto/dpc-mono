import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApiResponseDto } from './response.types';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// 페이지네이션 설정 인터페이스
export interface PaginationConfig {
  defaultPage?: number;
  defaultLimit?: number;
  maxLimit?: number;
  allowedSortFields?: string[];
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

// 기본 설정
const DEFAULT_PAGINATION_CONFIG: PaginationConfig = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
  allowedSortFields: ['createdAt', 'updatedAt', 'id'],
  defaultSortBy: 'createdAt',
  defaultSortOrder: 'desc',
};

// 제네릭 페이지네이션 DTO 팩토리
export function createPaginationQueryDto<T extends string = string>(
  config: PaginationConfig = {},
  allowedSortFields?: T[],
) {
  const finalConfig = { ...DEFAULT_PAGINATION_CONFIG, ...config };
  const sortFields = allowedSortFields || finalConfig.allowedSortFields || [];

  class PaginationQueryDto {
    @ApiPropertyOptional({
      description: `Page Number (Default: ${finalConfig.defaultPage}) / 페이지 번호 (기본값: ${finalConfig.defaultPage})`,
      example: finalConfig.defaultPage,
      minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = finalConfig.defaultPage;

    @ApiPropertyOptional({
      description: `Items Per Page (Default: ${finalConfig.defaultLimit}, Max: ${finalConfig.maxLimit}) / 페이지당 항목 수 (기본값: ${finalConfig.defaultLimit}, 최대: ${finalConfig.maxLimit})`,
      example: finalConfig.defaultLimit,
      minimum: 1,
      maximum: finalConfig.maxLimit,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(finalConfig.maxLimit!)
    limit?: number = finalConfig.defaultLimit;

    @ApiPropertyOptional({
      description: 'Sort Field / 정렬 필드',
      example: finalConfig.defaultSortBy,
      enum: sortFields.length > 0 ? sortFields : undefined,
    })
    @IsOptional()
    @IsString()
    @IsEnum(
      sortFields.length > 0 ? sortFields : ['createdAt', 'updatedAt', 'id'],
    )
    sortBy?: T = finalConfig.defaultSortBy as T;

    @ApiPropertyOptional({
      description: 'Sort Order (asc, desc) / 정렬 방향 (오름차순, 내림차순)',
      example: finalConfig.defaultSortOrder,
      enum: ['asc', 'desc'],
    })
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc' = finalConfig.defaultSortOrder;
  }

  return PaginationQueryDto;
}

// 기본 페이지네이션 DTO (기존 호환성 유지)
export class PaginationQueryDto extends createPaginationQueryDto() {}

export class PaginationDto {
  @ApiProperty({ example: 1, description: 'Current page (현재 페이지)' })
  page!: number;

  @ApiProperty({
    example: 10,
    description: 'Items per page (페이지당 항목 수)',
  })
  limit!: number;

  @ApiProperty({ example: 100, description: 'Total items (전체 항목 수)' })
  total!: number;
}

/**
 * 서비스 레벨에서 반환하는 페이지네이션 데이터 타입
 * TransformInterceptor가 이 형태를 기대하며, 최종적으로 PaginatedResponseDto로 변환됩니다.
 */
export interface PaginatedData<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}

export class PaginatedResponseDto<T = any> extends ApiResponseDto<T[]> {
  @ApiProperty({
    type: PaginationDto,
    description: 'Pagination information (페이지네이션 정보)',
  })
  pagination!: PaginationDto;
}

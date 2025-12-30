// src/modules/user/controllers/admin/dto/request/list-users-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { UserRoleType, UserStatus } from '@repo/database';

type UserSortFields = 'createdAt' | 'updatedAt' | 'email';

export class ListUsersQueryDto extends createPaginationQueryDto<UserSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'email'],
) {
  @ApiPropertyOptional({
    description: '이메일 검색 (부분 일치)',
    example: 'user@example.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: '사용자 역할 필터',
    enum: UserRoleType,
    example: UserRoleType.USER,
  })
  @IsOptional()
  @IsEnum(UserRoleType)
  role?: UserRoleType;

  @ApiPropertyOptional({
    description: '사용자 상태 필터',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601 형식) - 가입일 기준',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601 형식) - 가입일 기준',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}


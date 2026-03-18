// src/modules/user/profile/controllers/admin/dto/request/list-users-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { UserRoleType, UserStatus } from '@prisma/client';

type UserSortFields = 'createdAt' | 'updatedAt' | 'email' | 'loginId' | 'nickname';

export class ListUsersAdminQueryDto extends createPaginationQueryDto<UserSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'email', 'loginId', 'nickname'],
) {
  @ApiPropertyOptional({
    description: 'User Email (Partial Match) / 이메일 검색 (부분 일치)',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'Login ID (Partial Match) / 로그인 ID 검색 (부분 일치)',
  })
  @IsOptional()
  @IsString()
  loginId?: string;

  @ApiPropertyOptional({
    description: 'Nickname (Partial Match) / 닉네임 검색 (부분 일치)',
  })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiPropertyOptional({
    description: 'User Role Filter / 사용자 역할 필터',
    enum: UserRoleType,
  })
  @IsOptional()
  @IsEnum(UserRoleType)
  role?: UserRoleType;

  @ApiPropertyOptional({
    description: 'User Status Filter / 사용자 상태 필터',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Start Date (ISO 8601, Based on Joined Amount) / 시작 날짜 (ISO 8601 형식) - 가입일 기준',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End Date (ISO 8601, Based on Joined Amount) / 종료 날짜 (ISO 8601 형식) - 가입일 기준',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

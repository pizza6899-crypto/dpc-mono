import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { UserTierStatus } from '@prisma/client';

type UserTierSortFields = 'userId' | 'lastTierChangedAt';

export class ListUserTiersQueryDto extends createPaginationQueryDto<UserTierSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'userId',
    defaultSortOrder: 'asc',
  },
  ['userId', 'lastTierChangedAt'],
) {
  @ApiProperty({
    required: false,
    enum: UserTierStatus,
    description: 'Filter by user tier status / 유저 티어 상태 필터',
  })
  @IsOptional()
  @IsEnum(UserTierStatus)
  status?: UserTierStatus;

  @ApiProperty({
    required: false,
    description: 'Filter by specific tier ID / 특정 티어 ID 필터',
  })
  @IsOptional()
  @IsString()
  tierId?: string;

  @ApiProperty({
    required: false,
    description: 'Search by Email or User ID / 이메일 또는 유저 ID로 검색',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

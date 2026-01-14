// src/modules/promotion/controllers/admin/dto/request/list-participants-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumberString } from 'class-validator';
import { UserPromotionStatus } from '@repo/database';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

type ParticipantSortFields = 'createdAt' | 'updatedAt' | 'id';

export class ListParticipantsQueryDto extends createPaginationQueryDto<ParticipantSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'id'],
) {
  @ApiPropertyOptional({
    description: '상태 필터',
    example: UserPromotionStatus.ACTIVE,
    enum: UserPromotionStatus,
  })
  @IsOptional()
  @IsEnum(UserPromotionStatus)
  status?: UserPromotionStatus;

  @ApiPropertyOptional({
    description: '사용자 ID 필터',
    example: '1234567890123456789',
    type: String,
  })
  @IsOptional()
  @IsNumberString()
  userId?: string;
}

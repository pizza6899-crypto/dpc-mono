import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { RewardStatus } from '@prisma/client';

export class GetUserRewardsRequestDto extends createPaginationQueryDto<'createdAt'>({
    defaultSortBy: 'createdAt',
    allowedSortFields: ['createdAt'],
}) {
    @ApiPropertyOptional({
        description: 'Reward Status Filter / 보상 상태 필터 (PENDING, CLAIMED, EXPIRED, VOIDED)',
        enum: RewardStatus,
    })
    @IsOptional()
    @IsEnum(RewardStatus)
    status?: RewardStatus;
}

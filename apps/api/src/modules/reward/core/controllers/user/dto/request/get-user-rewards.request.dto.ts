import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import { RewardStatus, ExchangeCurrencyCode } from '@prisma/client';

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

    @ApiPropertyOptional({
        description: 'Currency Filter / 통화 다중 필터 (콤마로 구분하여 여러 개 입력 가능)',
        enum: ExchangeCurrencyCode,
        isArray: true,
    })
    @IsOptional()
    @Transform(({ value }) => (Array.isArray(value) ? value : value.split(',').map((v: string) => v.trim())))
    @IsEnum(ExchangeCurrencyCode, { each: true })
    currency?: ExchangeCurrencyCode[];
}

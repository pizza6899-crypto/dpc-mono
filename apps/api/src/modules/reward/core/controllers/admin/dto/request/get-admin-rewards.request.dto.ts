import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';
import {
  RewardStatus,
  RewardSourceType,
  RewardItemType,
  ExchangeCurrencyCode,
} from '@prisma/client';

export class GetAdminRewardsRequestDto extends createPaginationQueryDto<'createdAt'>(
  {
    defaultSortBy: 'createdAt',
    allowedSortFields: ['createdAt'],
  },
) {
  @ApiPropertyOptional({
    description: 'User ID / 유저 ID',
    example: '12345',
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Reward Status Filter / 보상 상태 필터',
    enum: RewardStatus,
  })
  @IsOptional()
  @IsEnum(RewardStatus)
  status?: RewardStatus;

  @ApiPropertyOptional({
    description: 'Reward Source Type Filter / 지급 소스 유형 필터',
    enum: RewardSourceType,
  })
  @IsOptional()
  @IsEnum(RewardSourceType)
  sourceType?: RewardSourceType;

  @ApiPropertyOptional({
    description: 'Reward Item Type Filter / 보상 유형 필터',
    enum: RewardItemType,
  })
  @IsOptional()
  @IsEnum(RewardItemType)
  rewardType?: RewardItemType;

  @ApiPropertyOptional({
    description:
      'Currency Filter / 통화 다중 필터 (콤마로 구분하여 여러 개 입력 가능)',
    enum: ExchangeCurrencyCode,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : value.split(',').map((v: string) => v.trim()),
  )
  @IsEnum(ExchangeCurrencyCode, { each: true })
  currency?: ExchangeCurrencyCode[];
}

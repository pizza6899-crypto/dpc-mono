import { IsOptional, IsDateString, IsEnum, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TierUpgradeRewardStatus } from '@prisma/client';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

export class GetRewardsQueryDto extends createPaginationQueryDto() {
  @ApiPropertyOptional({ description: 'User ID filter / 유저 ID 필터' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Status filter / 상태 필터',
    enum: TierUpgradeRewardStatus,
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',');
    return value;
  })
  @IsEnum(TierUpgradeRewardStatus, { each: true })
  status?: TierUpgradeRewardStatus[];

  @ApiPropertyOptional({ description: 'Start date (ISO8601) / 시작일' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO8601) / 종료일' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

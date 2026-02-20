import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { TierChangeType } from '@prisma/client';

import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

export class GetUserTierHistoryQueryDto extends createPaginationQueryDto(
  { defaultSortBy: 'changedAt' },
  ['changedAt'],
) {
  @ApiPropertyOptional({ description: 'Start date / 조회 시작일' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date / 조회 종료일' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({
    enum: TierChangeType,
    description: 'Change type / 변경 유형',
  })
  @IsOptional()
  @IsEnum(TierChangeType)
  changeType?: TierChangeType;
}

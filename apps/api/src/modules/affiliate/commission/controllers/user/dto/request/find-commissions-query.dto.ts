// src/modules/affiliate/commission/controllers/dto/request/find-commissions-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { CommissionStatus, ExchangeCurrencyCode } from '@prisma/client';
import { createPaginationQueryDto } from 'src/common/http/types';

type CommissionSortFields = 'createdAt' | 'updatedAt' | 'settlementDate';

export class FindCommissionsQueryDto extends createPaginationQueryDto<CommissionSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'settlementDate'],
) {
  @ApiPropertyOptional({
    description: '커미션 상태 필터',
    enum: CommissionStatus,
  })
  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @ApiPropertyOptional({
    description: '통화 필터',
    enum: ExchangeCurrencyCode,
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  currency?: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601 형식)',
    example: '2024-01-01T00:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601 형식)',
    example: '2024-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

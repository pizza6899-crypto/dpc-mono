import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  DepositDetailStatus,
  DepositMethodType,
  ExchangeCurrencyCode,
} from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

type DepositSortFields =
  | 'createdAt'
  | 'updatedAt'
  | 'actuallyPaid'
  | 'confirmedAt';

export class GetUserDepositsQueryDto extends createPaginationQueryDto<DepositSortFields>(
  {
    defaultLimit: 20,
    maxLimit: 100,
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  },
  ['createdAt', 'updatedAt', 'actuallyPaid', 'confirmedAt'],
) {
  @ApiPropertyOptional({
    description: '입금 상태 필터 / Deposit status filter',
    enum: DepositDetailStatus,
  })
  @IsOptional()
  @IsEnum(DepositDetailStatus)
  status?: DepositDetailStatus;

  @ApiPropertyOptional({
    description: '입금 방법 필터 / Deposit method filter',
    enum: DepositMethodType,
  })
  @IsOptional()
  @IsEnum(DepositMethodType)
  methodType?: DepositMethodType;

  @ApiPropertyOptional({
    description: '통화 필터 / Currency filter',
    enum: ExchangeCurrencyCode,
  })
  @IsOptional()
  @IsEnum(ExchangeCurrencyCode)
  currency?: ExchangeCurrencyCode;

  @ApiPropertyOptional({
    description: '시작 날짜 (ISO 8601 형식) / Start date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: '종료 날짜 (ISO 8601 형식) / End date (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { WithdrawalStatus, WithdrawalMethodType } from '@prisma/client';

export class GetWithdrawalsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by status / 상태 필터',
    enum: WithdrawalStatus,
  })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({
    description: 'Filter by method type / 방법 유형 필터',
    enum: WithdrawalMethodType,
  })
  @IsOptional()
  @IsEnum(WithdrawalMethodType)
  methodType?: WithdrawalMethodType;

  @ApiPropertyOptional({
    description: 'Page number / 페이지 번호',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page / 페이지당 항목 수',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 20;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponStatus } from '@prisma/client';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

export class GetAdminCouponsRequestDto extends createPaginationQueryDto<
  'createdAt' | 'code' | 'usageCount' | 'expiresAt'
>({
  defaultSortBy: 'createdAt',
  allowedSortFields: ['createdAt', 'code', 'usageCount', 'expiresAt'],
}) {
  @ApiPropertyOptional({
    description: 'Coupon ID / 쿠폰 ID',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({
    description: 'Coupon Code (Exact) / 쿠폰 코드 검색',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Coupon Status Filter / 쿠폰 상태 필터',
    enum: CouponStatus,
  })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

  @ApiPropertyOptional({ description: 'Start Date From / 시작일 필터' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startsAfter?: Date;

  @ApiPropertyOptional({ description: 'Expiry Date To / 만료일 필터' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresBefore?: Date;
}

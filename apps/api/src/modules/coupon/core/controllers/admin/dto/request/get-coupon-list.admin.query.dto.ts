import { ApiPropertyOptional } from '@nestjs/swagger';
import { CouponStatus } from '@prisma/client';
import { IsOptional, IsString, IsEnum, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCouponListAdminQueryDto {
  @ApiPropertyOptional({ description: 'Filter by partial code match' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ enum: CouponStatus, isArray: true, description: 'Filter by statuses' })
  @IsOptional()
  @IsEnum(CouponStatus, { each: true })
  @IsString({ each: true })
  status?: CouponStatus[];

  @ApiPropertyOptional({ description: 'Filter by Coupons starting from this date', example: '2024-03-01T00:00:00Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startsAt?: Date;

  @ApiPropertyOptional({ description: 'Filter by Coupons expiring before this date', example: '2024-12-31T23:59:59Z' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional({ description: 'Page number (default: 1)', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page (default: 10)', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}

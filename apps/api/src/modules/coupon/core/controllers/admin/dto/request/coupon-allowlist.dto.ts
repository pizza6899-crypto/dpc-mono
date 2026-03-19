import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { createPaginationQueryDto } from 'src/common/http/types/pagination.types';

export class CouponAllowlistResponseDto {
  @ApiProperty({ example: '123456789012345678', description: 'User ID / 유저 ID' })
  userId: string;

  @ApiProperty({ description: 'Registered At / 등록일' })
  createdAt: Date;
}

export class AddCouponAllowlistRequestDto {
  @ApiProperty({ type: [String], description: 'User ID List / 유저 ID 목록' })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}

export class GetCouponAllowlistQueryDto extends createPaginationQueryDto<'createdAt'>({
  defaultSortBy: 'createdAt',
  allowedSortFields: ['createdAt'],
}) {}

// apps/api/src/modules/notification/inbox/controllers/user/dto/request/find-notifications-query.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindNotificationsQueryDto {
  @ApiProperty({
    description: 'Filter by read status / 읽음 상태 필터',
    example: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isRead?: boolean;

  @ApiProperty({
    description:
      'Cursor for pagination (Encoded ID) / 페이지네이션용 커서 (난독화된 ID)',
    required: false,
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    description:
      'Maximum number of items to return (1-50) / 조회할 최대 항목 수 (최소 1, 최대 50)',
    example: 20,
    required: false,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}

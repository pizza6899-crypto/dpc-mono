// apps/api/src/modules/notification/inbox/controllers/user/dto/request/find-notifications-query.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindNotificationsQueryDto {
    @ApiProperty({ description: 'Filter by read status', example: false, required: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isRead?: boolean;

    @ApiProperty({ description: 'Cursor for pagination', example: '1234567890', required: false })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiProperty({ description: 'Maximum number of items to return', example: 20, required: false })
    @IsOptional()
    @Type(() => Number)
    limit?: number;
}

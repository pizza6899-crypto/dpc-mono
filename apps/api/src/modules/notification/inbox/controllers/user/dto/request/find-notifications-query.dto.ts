// apps/api/src/modules/notification/inbox/controllers/user/dto/request/find-notifications-query.dto.ts

import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class FindNotificationsQueryDto {
    @IsOptional()
    @Transform(({ value }) => value === 'true')
    @IsBoolean()
    isRead?: boolean;

    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @Type(() => Number)
    limit?: number;
}

// apps/api/src/modules/notification/alert/controllers/admin/dto/request/create-alert.request.dto.ts

import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelType } from '@repo/database';

export class CreateAlertRequestDto {
    @IsString()
    event: string;

    @IsOptional()
    @Type(() => String)
    userId?: string;

    @IsOptional()
    @IsString()
    targetGroup?: string;

    @IsObject()
    payload: Record<string, unknown>;

    @IsArray()
    @IsEnum(ChannelType, { each: true })
    channels: ChannelType[];

    @IsOptional()
    @IsString()
    idempotencyKey?: string;
}

// apps/api/src/modules/notification/alert/controllers/admin/dto/request/create-alert.request.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ChannelType } from '@repo/database';

import { NOTIFICATION_EVENTS, NOTIFICATION_TARGET_GROUPS } from '../../../../../common';

export class CreateAlertRequestDto {
    @ApiProperty({ description: 'Event name', enum: NOTIFICATION_EVENTS, example: NOTIFICATION_EVENTS.DEPOSIT_COMPLETED })
    @IsEnum(NOTIFICATION_EVENTS)
    event: string;

    @ApiProperty({ description: 'User ID', example: '1234567890', required: false })
    @IsOptional()
    @Type(() => String)
    userId?: string;

    @ApiProperty({ description: 'Target group', enum: NOTIFICATION_TARGET_GROUPS, example: NOTIFICATION_TARGET_GROUPS.ALL, required: false })
    @IsOptional()
    @IsEnum(NOTIFICATION_TARGET_GROUPS)
    targetGroup?: string;

    @ApiProperty({ description: 'Alert payload', example: { email: 'user@example.com' } })
    @IsObject()
    payload: Record<string, unknown>;

    @ApiProperty({ description: 'Channels to notify', enum: ChannelType, isArray: true, example: [ChannelType.EMAIL] })
    @IsArray()
    @IsEnum(ChannelType, { each: true })
    channels: ChannelType[];

    @ApiProperty({ description: 'Idempotency key', example: 'uuid-v4-key', required: false })
    @IsOptional()
    @IsString()
    idempotencyKey?: string;
}

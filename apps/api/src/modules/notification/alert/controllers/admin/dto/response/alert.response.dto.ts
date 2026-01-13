// apps/api/src/modules/notification/alert/controllers/admin/dto/response/alert.response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { AlertStatus } from '@repo/database';

export class AlertResponseDto {
    @ApiProperty({ description: 'Alert ID', example: '1234567890' })
    id: string;

    @ApiProperty({ description: 'Event name', example: 'user.registered' })
    event: string;

    @ApiProperty({ description: 'User ID', example: '1234567890', nullable: true })
    userId: string | null;

    @ApiProperty({ description: 'Target group', example: 'VIP', nullable: true })
    targetGroup: string | null;

    @ApiProperty({ description: 'Alert payload', example: { email: 'user@example.com' } })
    payload: Record<string, unknown>;

    @ApiProperty({ description: 'Idempotency key', example: 'uuid-v4-key', nullable: true })
    idempotencyKey: string | null;

    @ApiProperty({ description: 'Alert status', enum: AlertStatus, example: AlertStatus.PENDING })
    status: AlertStatus;

    @ApiProperty({ description: 'Created at', example: '2024-01-01T00:00:00.000Z' })
    createdAt: string;

    @ApiProperty({ description: 'Updated at', example: '2024-01-01T00:00:00.000Z' })
    updatedAt: string;
}



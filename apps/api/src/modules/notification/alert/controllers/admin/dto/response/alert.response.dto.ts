// apps/api/src/modules/notification/alert/controllers/admin/dto/response/alert.response.dto.ts

import { AlertStatus } from '@repo/database';
import { Alert } from '../../../../domain';

export class AlertResponseDto {
    id: string;
    event: string;
    userId: string | null;
    targetGroup: string | null;
    payload: Record<string, unknown>;
    idempotencyKey: string | null;
    status: AlertStatus;
    createdAt: string;
    updatedAt: string;

    static fromEntity(alert: Alert): AlertResponseDto {
        const dto = new AlertResponseDto();
        dto.id = alert.id?.toString() ?? '';
        dto.event = alert.event;
        dto.userId = alert.userId?.toString() ?? null;
        dto.targetGroup = alert.targetGroup;
        dto.payload = alert.payload;
        dto.idempotencyKey = alert.idempotencyKey;
        dto.status = alert.status;
        dto.createdAt = alert.createdAt.toISOString();
        dto.updatedAt = alert.updatedAt.toISOString();
        return dto;
    }
}

export class AlertListResponseDto {
    items: AlertResponseDto[];
    total: number;

    static fromEntities(
        items: Alert[],
        total: number,
    ): AlertListResponseDto {
        const dto = new AlertListResponseDto();
        dto.items = items.map(AlertResponseDto.fromEntity);
        dto.total = total;
        return dto;
    }
}

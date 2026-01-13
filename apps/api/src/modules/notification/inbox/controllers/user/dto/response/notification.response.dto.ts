// apps/api/src/modules/notification/inbox/controllers/user/dto/response/notification.response.dto.ts

import { NotificationLog } from '../../../../domain';

export class NotificationResponseDto {
    id: string;
    createdAt: string;
    title: string;
    body: string;
    actionUri: string | null;
    isRead: boolean;
    readAt: string | null;
    metadata: Record<string, unknown> | null;

    static fromEntity(log: NotificationLog): NotificationResponseDto {
        const dto = new NotificationResponseDto();
        dto.id = log.id?.toString() ?? '';
        dto.createdAt = log.createdAt.toISOString();
        dto.title = log.title;
        dto.body = log.body;
        dto.actionUri = log.actionUri;
        dto.isRead = log.isRead;
        dto.readAt = log.readAt?.toISOString() ?? null;
        dto.metadata = log.metadata;
        return dto;
    }
}

export class NotificationListResponseDto {
    items: NotificationResponseDto[];
    nextCursor: string | null;

    static fromEntities(
        logs: NotificationLog[],
    ): NotificationListResponseDto {
        const dto = new NotificationListResponseDto();
        dto.items = logs.map(NotificationResponseDto.fromEntity);
        dto.nextCursor =
            logs.length > 0 ? logs[logs.length - 1].id?.toString() ?? null : null;
        return dto;
    }
}

export class UnreadCountResponseDto {
    count: number;

    static from(count: number): UnreadCountResponseDto {
        const dto = new UnreadCountResponseDto();
        dto.count = count;
        return dto;
    }
}

export class MarkAllAsReadResponseDto {
    updatedCount: number;

    static from(count: number): MarkAllAsReadResponseDto {
        const dto = new MarkAllAsReadResponseDto();
        dto.updatedCount = count;
        return dto;
    }
}

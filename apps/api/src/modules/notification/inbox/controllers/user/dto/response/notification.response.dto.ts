import { ApiProperty } from '@nestjs/swagger';

// apps/api/src/modules/notification/inbox/controllers/user/dto/response/notification.response.dto.ts



export class NotificationResponseDto {
    @ApiProperty({ description: 'Notification ID', example: '1234567890' })
    id: string;

    @ApiProperty({ description: 'Created date', example: '2024-01-01T00:00:00Z' })
    createdAt: string;

    @ApiProperty({ description: 'Notification title', example: 'Welcome!' })
    title: string;

    @ApiProperty({ description: 'Notification body', example: 'Thank you for joining us.' })
    body: string;

    @ApiProperty({ description: 'Action URI', example: '/profile', required: false, nullable: true })
    actionUri: string | null;

    @ApiProperty({ description: 'Read status', example: false })
    isRead: boolean;

    @ApiProperty({ description: 'Read date', example: '2024-01-01T00:00:00Z', required: false, nullable: true })
    readAt: string | null;

    @ApiProperty({ description: 'Metadata', example: { type: 'welcome' }, required: false, nullable: true })
    metadata: Record<string, unknown> | null;
}

export class NotificationListResponseDto {
    @ApiProperty({ type: [NotificationResponseDto] })
    items: NotificationResponseDto[];

    @ApiProperty({ description: 'Cursor for next page', example: '1234567890', required: false, nullable: true })
    nextCursor: string | null;
}

export class UnreadCountResponseDto {
    @ApiProperty({ description: 'Number of unread notifications', example: 5 })
    count: number;
}

export class MarkAllAsReadResponseDto {
    @ApiProperty({ description: 'Number of notifications updated', example: 10 })
    updatedCount: number;
}

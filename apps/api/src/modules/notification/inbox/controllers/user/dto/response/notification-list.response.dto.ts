import { ApiProperty } from '@nestjs/swagger';
import { NotificationResponseDto } from './notification.response.dto';

/**
 * Notification List Response DTO / 알림 목록 응답 DTO
 */
export class NotificationListResponseDto {
    @ApiProperty({
        type: [NotificationResponseDto],
        description: 'List of notifications / 알림 목록',
    })
    items: NotificationResponseDto[];

    @ApiProperty({
        description: 'Cursor for next page (Encoded ID) / 다음 페이지용 커서 (난독화된 ID)',
        example: 'n_xyz789',
        required: false,
        nullable: true,
    })
    nextCursor: string | null;
}

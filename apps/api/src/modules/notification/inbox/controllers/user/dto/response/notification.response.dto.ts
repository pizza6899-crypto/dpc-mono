import { ApiProperty } from '@nestjs/swagger';

/**
 * Single Notification Response DTO / 단일 알림 응답 DTO
 */
export class NotificationResponseDto {
  @ApiProperty({
    description: 'Notification ID (Encoded) / 알림 ID (난독화됨)',
    example: 'n_abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Created Date / 생성 일시',
    example: '2024-01-01T00:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Notification Title / 알림 제목',
    example: 'Welcome!',
    required: false,
    nullable: true,
  })
  title: string | null;

  @ApiProperty({
    description: 'Notification Body / 알림 본문',
    example: 'Thank you for joining us.',
    required: false,
    nullable: true,
  })
  body: string | null;

  @ApiProperty({
    description: 'Action URI / 클릭 시 이동할 경로',
    example: '/profile',
    required: false,
    nullable: true,
  })
  actionUri: string | null;

  @ApiProperty({
    description: 'Read Status / 읽음 상태',
    example: false,
  })
  isRead: boolean;

  @ApiProperty({
    description: 'Read Date / 읽은 일시',
    example: '2024-01-01T00:00:00Z',
    required: false,
    nullable: true,
  })
  readAt: string | null;

  @ApiProperty({
    description: 'Metadata / 메타데이터',
    example: { type: 'welcome' },
    required: false,
    nullable: true,
  })
  metadata: Record<string, unknown> | null;
}

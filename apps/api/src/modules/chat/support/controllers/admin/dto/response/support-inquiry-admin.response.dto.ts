import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ChatRoomType,
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@prisma/client';

export class SupportInquiryAdminResponseDto {
  @ApiProperty({ description: 'Room ID / 방 ID', example: '23984723984723' })
  id: string;

  @ApiProperty({
    description: 'Sqids ID (Encoded) / 인코딩된 ID',
    example: 'sr_abc123',
  })
  sid: string;

  @ApiProperty({ description: 'Is Active / 활성화 상태', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'Metadata / 메타데이터', example: {} })
  metadata: any;

  @ApiProperty({ description: 'Created At / 생성일' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated At / 수정일' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Last Message At / 마지막 메시지 일시' })
  lastMessageAt: Date | null;

  @ApiProperty({
    description: 'Support Status / 상담 상태',
    enum: SupportStatus,
    example: SupportStatus.OPEN,
  })
  supportStatus: SupportStatus;

  @ApiProperty({
    description: 'Support Priority / 상담 우선순위',
    enum: SupportPriority,
    example: SupportPriority.NORMAL,
  })
  supportPriority: SupportPriority;

  @ApiProperty({
    description: 'Support Category / 상담 카테고리',
    enum: SupportCategory,
    example: SupportCategory.ETC,
  })
  supportCategory: SupportCategory;

  @ApiProperty({
    description: 'Support Subject / 상담 제목',
    example: 'Payment inquiry',
  })
  supportSubject: string;

  @ApiPropertyOptional({
    description: 'Assigned Admin ID / 배정된 관리자 ID',
    example: 'u_123',
  })
  supportAdminId: string | null;

  @ApiProperty({
    description: 'User Nickname / 사용자 닉네임',
    example: 'Jack',
  })
  userNickname: string;

  @ApiProperty({
    description: 'User Login ID / 사용자 아이디',
    example: 'user01',
  })
  userLoginId: string;

  @ApiPropertyOptional({
    description: 'User Avatar URL / 사용자 아바타 URL',
    example: 'https://example.com/avatar.png',
  })
  userAvatarUrl: string | null;

  @ApiPropertyOptional({
    description: 'Last Message Content / 마지막 메시지 내용',
    example: 'Hello, I have a question.',
  })
  lastMessageContent: string | null;

  @ApiProperty({
    description: 'Unread Message Count / 미확입 메시지 수',
    example: 3,
  })
  unreadCount: number;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMessageType } from '@prisma/client';

export class ChatMessageUserResponseDto {
  @ApiProperty({
    description: 'Message ID (Encoded) / 메시지 ID',
    example: 'cm_123',
  })
  id: string;

  @ApiPropertyOptional({
    description: 'Sender ID (Encoded) / 발신자 ID (null일 경우 시스템)',
    example: 'u_123',
  })
  senderId: string | null;

  @ApiProperty({ description: 'Content / 메시지 내용', example: 'Hello!' })
  content: string;

  @ApiProperty({
    description: 'Type / 타입',
    enum: ChatMessageType,
    example: ChatMessageType.TEXT,
  })
  type: ChatMessageType;

  @ApiPropertyOptional({ description: 'Metadata / 메타데이터', example: {} })
  metadata: any | null;

  @ApiProperty({
    description: 'Created At / 생성 시각',
    example: '2024-03-08T00:00:00Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Is Read / 읽음 여부 (1:1 등에서 상대방이 읽었는지 여부)',
    example: true,
  })
  isRead?: boolean;
}

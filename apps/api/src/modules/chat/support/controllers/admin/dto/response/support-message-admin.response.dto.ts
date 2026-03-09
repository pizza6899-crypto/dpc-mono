import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatMessageType } from '@prisma/client';

export class SupportMessageAdminResponseDto {
    @ApiProperty({ description: 'Message ID / 메시지 ID', example: '23984723984723' })
    id: string;

    @ApiProperty({ description: 'Room ID / 방 ID', example: '23984723984723' })
    roomId: string;

    @ApiPropertyOptional({ description: 'Sender ID / 발신자 ID (null일 경우 시스템)', example: '23984723984723' })
    senderId: string | null;

    @ApiProperty({ description: 'Content / 메시지 내용', example: 'Hello!' })
    content: string;

    @ApiProperty({ description: 'Type / 타입', enum: ChatMessageType, example: ChatMessageType.TEXT })
    type: ChatMessageType;

    @ApiPropertyOptional({ description: 'Metadata / 메타데이터', example: {} })
    metadata: any | null;

    @ApiProperty({ description: 'Created At / 생성 시각' })
    createdAt: Date;

    @ApiPropertyOptional({ description: 'Is Read / 읽음 여부', example: true })
    isRead?: boolean;
}

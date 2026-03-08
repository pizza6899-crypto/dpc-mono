import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatRoomType } from '@prisma/client';

export class ChatRoomUserResponseDto {
    @ApiProperty({ description: 'Room ID (Encoded) / 채팅방 ID', example: 'ROOM_ABC123' })
    id: string;

    @ApiPropertyOptional({ description: 'Slug / 슬러그', example: 'global:en' })
    slug: string | null;

    @ApiProperty({ description: 'Type / 타입', enum: ChatRoomType, example: ChatRoomType.PUBLIC })
    type: ChatRoomType;

    @ApiProperty({ description: 'Metadata / 메타데이터', example: { language: 'en' } })
    metadata: any;

    @ApiProperty({ description: 'Slow Mode Seconds / 도배 방지 쿨다운', example: 3 })
    slowModeSeconds: number;
}
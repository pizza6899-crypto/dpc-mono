import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatRoomType } from '@prisma/client';

export class ChatRoomAdminResponseDto {
    @ApiProperty({ description: 'Internal Chat Room ID / 내부 채팅방 ID', example: '23984723984723' })
    id: string;

    @ApiProperty({ description: 'Type / 타입', enum: ChatRoomType, example: ChatRoomType.PUBLIC })
    type: ChatRoomType;

    @ApiProperty({ description: 'Is Active / 활성화 상태', example: true })
    isActive: boolean;

    @ApiProperty({ description: 'Metadata / 메타데이터', example: {} })
    metadata: any;

    @ApiProperty({ description: 'Slow Mode Seconds / 도배 방지 쿨다운', example: 3 })
    slowModeSeconds: number;

    @ApiProperty({ description: 'Min Tier Level / 최소 티어', example: 0 })
    minTierLevel: number;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated At / 수정일' })
    updatedAt: Date;

    @ApiPropertyOptional({ description: 'Last Message At / 마지막 메시지 일시' })
    lastMessageAt: Date | null;
}



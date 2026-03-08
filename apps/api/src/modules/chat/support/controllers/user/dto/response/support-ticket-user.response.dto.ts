import { ApiProperty } from '@nestjs/swagger';
import { SupportStatus, SupportPriority } from '@prisma/client';

export class SupportTicketUserResponseDto {
    @ApiProperty({ description: 'Ticket ID / 티켓 ID' })
    id: string;

    @ApiProperty({ description: 'Category / 카테고리', nullable: true })
    category: string | null;

    @ApiProperty({ description: 'Subject / 제목', nullable: true })
    subject: string | null;

    @ApiProperty({ description: 'Status / 상태', enum: SupportStatus })
    status: SupportStatus;

    @ApiProperty({ description: 'Priority / 우선순위', enum: SupportPriority })
    priority: SupportPriority;

    @ApiProperty({ description: 'Room ID / 채팅방 ID' })
    roomId: string;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;
}


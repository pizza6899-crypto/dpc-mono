import { ApiProperty } from '@nestjs/swagger';
import { SupportStatus, SupportPriority } from '@prisma/client';

export class SupportTicketAdminResponseDto {
    @ApiProperty({ description: 'Ticket ID / 티켓 ID' })
    id: string; // Admin uses string (BigInt.toString())

    @ApiProperty({ description: 'User ID / 사용자 ID' })
    userId: string;

    @ApiProperty({ description: 'Admin ID / 담당 상담원 ID', nullable: true })
    adminId: string | null;

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

    @ApiProperty({ description: 'Closed At / 종료일', nullable: true })
    closedAt: Date | null;

    @ApiProperty({ description: 'Created At / 생성일' })
    createdAt: Date;

    @ApiProperty({ description: 'Updated At / 수정일' })
    updatedAt: Date;

    constructor(partial: Partial<SupportTicketAdminResponseDto>) {
        Object.assign(this, partial);
    }
}

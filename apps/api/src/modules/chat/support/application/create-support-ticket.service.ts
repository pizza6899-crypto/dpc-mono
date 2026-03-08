import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { SUPPORT_TICKET_REPOSITORY_PORT, type SupportTicketRepositoryPort } from '../ports/support-ticket.repository.port';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { SupportTicket } from '../domain/entities/support-ticket.entity';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomType, SupportPriority } from '@prisma/client';
import { SupportException } from '../domain/support.exception';
import { MessageCode } from '@repo/shared';

export interface CreateSupportTicketParams {
    userId: bigint;
    category?: string;
    subject?: string;
    priority?: SupportPriority;
}

@Injectable()
export class CreateSupportTicketService {
    constructor(
        @Inject(SUPPORT_TICKET_REPOSITORY_PORT)
        private readonly ticketRepository: SupportTicketRepositoryPort,
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
    ) { }

    @Transactional()
    async execute(params: CreateSupportTicketParams): Promise<SupportTicket> {
        // 1. Check if an active ticket already exists
        const activeTicket = await this.ticketRepository.findActiveTicketByUserId(params.userId);
        if (activeTicket) {
            throw new SupportException('You already have an active support ticket', MessageCode.VALIDATION_ERROR);
        }

        // 2. Find or create a support chat room for the user
        const slug = `support:${params.userId}`;
        let room = await this.roomRepository.findBySlug(slug);

        if (!room) {
            room = new ChatRoom(
                0n,
                slug,
                ChatRoomType.SUPPORT,
                true,
                {}, // metadata
                0,  // slowModeSeconds
                0,  // minTierLevel
                new Date(),
                new Date(),
                null,
            );
            room = await this.roomRepository.save(room);
        }

        // 3. Create the support ticket
        const ticket = SupportTicket.create({
            userId: params.userId,
            roomId: room.id,
            category: params.category,
            subject: params.subject,
            priority: params.priority,
        });

        return await this.ticketRepository.save(ticket);
    }
}

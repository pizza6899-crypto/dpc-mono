import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { ChatRoomNotFoundException } from '../../rooms/domain/chat-room.exception';
import { SupportStatus, ChatRoomType } from '@prisma/client';

export interface PendingSupportInquiryParams {
    roomId: bigint;
}

@Injectable()
export class PendingSupportInquiryService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
    ) { }

    @Transactional()
    async execute(params: PendingSupportInquiryParams): Promise<ChatRoom> {
        const room = await this.roomRepository.findById(params.roomId);
        if (!room || room.type !== ChatRoomType.SUPPORT) {
            throw new ChatRoomNotFoundException();
        }

        const updatedRoom = new ChatRoom(
            room.id,
            room.type,
            room.isActive,
            room.metadata,
            room.slowModeSeconds,
            room.minTierLevel,
            room.createdAt,
            new Date(),
            room.lastMessageAt,
            room.supportInfo ? {
                ...room.supportInfo,
                status: SupportStatus.PENDING,
            } : null,
        );

        return this.roomRepository.save(updatedRoom);
    }
}

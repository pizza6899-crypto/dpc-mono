import { Inject, Injectable } from '@nestjs/common';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { SupportStatus, SupportPriority } from '@prisma/client';

export interface ListSupportInquiriesParams {
    status?: SupportStatus;
    priority?: SupportPriority;
    category?: string;
    adminId?: bigint;
}

@Injectable()
export class ListSupportInquiriesService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
    ) { }

    async execute(params: ListSupportInquiriesParams): Promise<ChatRoom[]> {
        return this.roomRepository.listSupportRooms({
            status: params.status,
            priority: params.priority,
            category: params.category,
            adminId: params.adminId,
        });
    }
}

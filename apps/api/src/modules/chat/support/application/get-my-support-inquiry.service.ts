import { Inject, Injectable } from '@nestjs/common';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../../rooms/ports/chat-room.repository.port';
import { ChatRoom } from '../../rooms/domain/chat-room.entity';
import { getSocketRoom } from 'src/infrastructure/websocket/constants/websocket-rooms.constant';

@Injectable()
export class GetMySupportInquiryService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
    ) { }

    async execute(userId: bigint): Promise<ChatRoom | null> {
        const slug = getSocketRoom.supportRoom(`u:${userId}`);
        return this.roomRepository.findBySlug(slug);
    }
}

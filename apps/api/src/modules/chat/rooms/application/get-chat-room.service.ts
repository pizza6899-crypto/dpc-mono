import { Inject, Injectable } from '@nestjs/common';
import { CHAT_ROOM_REPOSITORY_PORT, type ChatRoomRepositoryPort } from '../ports/chat-room.repository.port';
import { ChatRoomNotFoundException } from '../domain/chat-room.exception';
import type { ChatRoom } from '../domain/chat-room.entity';

export interface GetChatRoomParams {
    id?: bigint;
    slug?: string;
}

@Injectable()
export class GetChatRoomService {
    constructor(
        @Inject(CHAT_ROOM_REPOSITORY_PORT)
        private readonly roomRepository: ChatRoomRepositoryPort,
    ) { }

    async execute(params: GetChatRoomParams): Promise<ChatRoom> {
        let room: ChatRoom | null = null;

        if (params.id) {
            room = await this.roomRepository.findById(params.id);
        } else if (params.slug) {
            room = await this.roomRepository.findBySlug(params.slug);
        }

        if (!room) {
            throw new ChatRoomNotFoundException();
        }

        return room;
    }
}

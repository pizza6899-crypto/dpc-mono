import { Inject, Injectable } from '@nestjs/common';
import {
  CHAT_ROOM_REPOSITORY_PORT,
  type ChatRoomRepositoryPort,
} from '../ports/chat-room.repository.port';
import { ChatRoomNotFoundException } from '../domain/chat-room.exception';
import type { ChatRoom } from '../domain/chat-room.entity';

export interface GetChatRoomParams {
  id: bigint;
}

@Injectable()
export class GetChatRoomService {
  constructor(
    @Inject(CHAT_ROOM_REPOSITORY_PORT)
    private readonly roomRepository: ChatRoomRepositoryPort,
  ) {}

  async execute(params: GetChatRoomParams): Promise<ChatRoom> {
    const room = await this.roomRepository.findById(params.id);

    if (!room) {
      throw new ChatRoomNotFoundException();
    }

    return room;
  }
}

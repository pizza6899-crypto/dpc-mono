import { Inject, Injectable } from '@nestjs/common';
import {
  CHAT_ROOM_REPOSITORY_PORT,
  type ChatRoomRepositoryPort,
} from '../ports/chat-room.repository.port';
import { ChatRoom } from '../domain/chat-room.entity';

@Injectable()
export class ListChatRoomsService {
  constructor(
    @Inject(CHAT_ROOM_REPOSITORY_PORT)
    private readonly roomRepository: ChatRoomRepositoryPort,
  ) {}

  async execute(): Promise<ChatRoom[]> {
    return await this.roomRepository.listActiveRooms();
  }
}

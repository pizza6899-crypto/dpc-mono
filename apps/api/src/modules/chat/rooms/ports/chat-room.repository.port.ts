import { SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';
import type { ChatRoom } from '../domain/chat-room.entity';

export const CHAT_ROOM_REPOSITORY_PORT = Symbol('CHAT_ROOM_REPOSITORY_PORT');

export interface ChatRoomRepositoryPort {
    findById(id: bigint): Promise<ChatRoom | null>;
    listActiveRooms(): Promise<ChatRoom[]>;

    findSupportRoomByUserId(userId: bigint): Promise<ChatRoom | null>;

    save(room: ChatRoom): Promise<ChatRoom>;

}

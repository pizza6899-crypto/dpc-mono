import { SupportStatus, SupportPriority, SupportCategory } from '@prisma/client';
import type { ChatRoom } from '../domain/chat-room.entity';

export const CHAT_ROOM_REPOSITORY_PORT = Symbol('CHAT_ROOM_REPOSITORY_PORT');

export interface ChatRoomRepositoryPort {
    findById(id: bigint): Promise<ChatRoom | null>;
    listActiveRooms(): Promise<ChatRoom[]>;
    listSupportRooms(filters: {
        status?: SupportStatus;
        priority?: SupportPriority;
        category?: SupportCategory;
        adminId?: bigint;
    }): Promise<ChatRoom[]>;

    findActiveSupportRoomByUserId(userId: bigint): Promise<ChatRoom | null>;

    save(room: ChatRoom): Promise<ChatRoom>;

}

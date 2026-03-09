import type { ChatRoom } from '../domain/chat-room.entity';

export const CHAT_ROOM_REPOSITORY_PORT = Symbol('CHAT_ROOM_REPOSITORY_PORT');

export interface ChatRoomRepositoryPort {
    findById(id: bigint): Promise<ChatRoom | null>;
    findBySlug(slug: string): Promise<ChatRoom | null>;
    listActiveRooms(): Promise<ChatRoom[]>;
    listSupportRooms(filters: {
        status?: string;
        priority?: string;
        category?: string;
        adminId?: bigint;
    }): Promise<ChatRoom[]>;

    save(room: ChatRoom): Promise<ChatRoom>;

}

import { ChatRoomMember } from "../domain/chat-room-member.entity";

export const CHAT_ROOM_MEMBER_REPOSITORY_PORT = Symbol('CHAT_ROOM_MEMBER_REPOSITORY_PORT');

export interface ChatRoomMemberRepositoryPort {
    findByRoomIdAndUserId(roomId: bigint, userId: bigint): Promise<ChatRoomMember | null>;
    listByUserId(userId: bigint): Promise<ChatRoomMember[]>;
    listByRoomId(roomId: bigint): Promise<ChatRoomMember[]>;
    save(member: ChatRoomMember): Promise<ChatRoomMember>;
    delete(roomId: bigint, userId: bigint): Promise<void>;
}


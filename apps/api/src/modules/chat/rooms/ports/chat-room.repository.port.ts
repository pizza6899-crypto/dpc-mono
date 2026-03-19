import {
  SupportStatus,
  SupportPriority,
  SupportCategory,
} from '@prisma/client';
import type { ChatRoom } from '../domain/chat-room.entity';

export const CHAT_ROOM_REPOSITORY_PORT = Symbol('CHAT_ROOM_REPOSITORY_PORT');

export interface ChatRoomRepositoryPort {
  findById(id: bigint): Promise<ChatRoom | null>;
  listActiveRooms(): Promise<ChatRoom[]>;

  findSupportRoomByUserId(userId: bigint): Promise<ChatRoom | null>;
  /** 관리자가 담당자로 지정된 활성 상담방 목록 조회 */
  findActiveRoomsByAdminId(adminId: bigint): Promise<ChatRoom[]>;

  save(room: ChatRoom): Promise<ChatRoom>;
  updateLastMessageAt(roomId: bigint, lastMessageAt: Date): Promise<void>;
}

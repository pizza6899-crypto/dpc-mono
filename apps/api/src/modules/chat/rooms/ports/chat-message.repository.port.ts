import { ChatMessage } from '../domain/chat-message.entity';

export const CHAT_MESSAGE_REPOSITORY_PORT = Symbol('CHAT_MESSAGE_REPOSITORY_PORT');

export interface ChatMessageRepositoryPort {
    /**
     * 메세지를 저장합니다.
     */
    save(message: ChatMessage): Promise<ChatMessage>;

    /**
     * 특정 룸의 메세지 목록을 조회합니다.
     */
    findByRoomId(roomId: bigint, limit?: number, lastMessageId?: bigint): Promise<ChatMessage[]>;
}


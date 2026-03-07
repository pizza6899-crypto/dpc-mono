import { ChatConfig } from '../domain/chat-config.entity';

export const CHAT_CONFIG_REPOSITORY_PORT = Symbol('CHAT_CONFIG_REPOSITORY_PORT');

export interface ChatConfigRepositoryPort {
    /**
     * 글로벌 채팅 설정을 조회합니다.
     * 존재하지 않을 경우 null을 반환합니다.
     */
    find(): Promise<ChatConfig | null>;

    /**
     * 글로벌 채팅 설정을 저장(Upsert)합니다.
     */
    save(config: ChatConfig): Promise<void>;
}

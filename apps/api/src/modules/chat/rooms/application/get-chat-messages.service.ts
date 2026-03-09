import { Injectable, Inject } from '@nestjs/common';
import { CHAT_MESSAGE_REPOSITORY_PORT, type ChatMessageRepositoryPort } from '../ports/chat-message.repository.port';
import { ChatMessage } from '../domain/chat-message.entity';

export interface GetChatMessagesParams {
    roomId: bigint;
    limit?: number;
    lastMessageId?: bigint;
}

@Injectable()
export class GetChatMessagesService {
    constructor(
        @Inject(CHAT_MESSAGE_REPOSITORY_PORT)
        private readonly messageRepository: ChatMessageRepositoryPort,
    ) { }

    async execute(params: GetChatMessagesParams): Promise<ChatMessage[]> {
        return this.messageRepository.findByRoomId(
            params.roomId,
            params.limit ?? 30,
            params.lastMessageId,
        );
    }
}

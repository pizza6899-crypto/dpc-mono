import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { CHAT_MESSAGE_REPOSITORY_PORT, type ChatMessageRepositoryPort } from '../ports/chat-message.repository.port';
import { ChatMessage } from '../domain/chat-message.entity';
import { ChatMessageNotFoundException, ChatMessageForbiddenException } from '../domain/chat-message.exception';
import { ChatMessagePolicy } from '../domain/chat-message.policy';

export interface DeleteChatMessageParams {
    messageId: bigint;
    deleterId: bigint;
    isAdmin: boolean;
}

@Injectable()
export class DeleteChatMessageService {
    constructor(
        @Inject(CHAT_MESSAGE_REPOSITORY_PORT)
        private readonly messageRepository: ChatMessageRepositoryPort,
        private readonly policy: ChatMessagePolicy,
    ) { }

    @Transactional()
    async execute(params: DeleteChatMessageParams): Promise<ChatMessage> {
        const message = await this.messageRepository.findById(params.messageId);
        if (!message) {
            throw new ChatMessageNotFoundException();
        }
        if (!this.policy.canDelete(message, params.deleterId, params.isAdmin)) {
            throw new ChatMessageForbiddenException();
        }

        const deletedMessage = message.delete();
        return this.messageRepository.update(deletedMessage);
    }
}

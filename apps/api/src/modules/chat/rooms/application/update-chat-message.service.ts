import { Injectable, Inject } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import {
  CHAT_MESSAGE_REPOSITORY_PORT,
  type ChatMessageRepositoryPort,
} from '../ports/chat-message.repository.port';
import { ChatMessage } from '../domain/chat-message.entity';
import {
  ChatMessageNotFoundException,
  ChatMessageForbiddenException,
} from '../domain/chat-message.exception';
import { ChatMessagePolicy } from '../domain/chat-message.policy';

export interface UpdateChatMessageParams {
  messageId: bigint;
  content: string;
  updaterId: bigint;
  isAdmin: boolean;
}

@Injectable()
export class UpdateChatMessageService {
  constructor(
    @Inject(CHAT_MESSAGE_REPOSITORY_PORT)
    private readonly messageRepository: ChatMessageRepositoryPort,
    private readonly policy: ChatMessagePolicy,
  ) {}

  @Transactional()
  async execute(params: UpdateChatMessageParams): Promise<ChatMessage> {
    const message = await this.messageRepository.findById(params.messageId);
    if (!message) {
      throw new ChatMessageNotFoundException();
    }

    if (!this.policy.canUpdate(message, params.updaterId, params.isAdmin)) {
      throw new ChatMessageForbiddenException();
    }

    const updatedMessage = message.updateContent(params.content);
    return this.messageRepository.update(updatedMessage);
  }
}

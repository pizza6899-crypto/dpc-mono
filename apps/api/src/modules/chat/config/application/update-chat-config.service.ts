import { Inject, Injectable } from '@nestjs/common';
import { Transactional } from '@nestjs-cls/transactional';
import { ChatConfig } from '../domain/chat-config.entity';
import {
  CHAT_CONFIG_REPOSITORY_PORT,
  type ChatConfigRepositoryPort,
} from '../ports/chat-config.repository.port';

export interface UpdateChatConfigParams {
  isGlobalChatEnabled: boolean;
  maxMessageLength: number;
  defaultSlowModeSeconds: number;
  minChatTierLevel: number;
  blockDuplicateMessages: boolean;
}

@Injectable()
export class UpdateChatConfigService {
  constructor(
    @Inject(CHAT_CONFIG_REPOSITORY_PORT)
    private readonly repository: ChatConfigRepositoryPort,
  ) {}

  @Transactional()
  async execute(params: UpdateChatConfigParams): Promise<void> {
    const config = new ChatConfig(
      params.isGlobalChatEnabled,
      params.maxMessageLength,
      params.defaultSlowModeSeconds,
      params.minChatTierLevel,
      params.blockDuplicateMessages,
      new Date(),
    );

    await this.repository.save(config);
  }
}

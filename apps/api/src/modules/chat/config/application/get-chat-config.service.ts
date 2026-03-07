import { Inject, Injectable } from '@nestjs/common';
import { ChatConfigNotFoundException } from '../domain/chat-config.exception';
import {
    CHAT_CONFIG_REPOSITORY_PORT,
    type ChatConfigRepositoryPort,
} from '../ports/chat-config.repository.port';

export interface ChatConfigResult {
    isGlobalChatEnabled: boolean;
    maxMessageLength: number;
    defaultSlowModeSeconds: number;
    minChatTierLevel: number;
    blockDuplicateMessages: boolean;
    updatedAt: Date;
}

@Injectable()
export class GetChatConfigService {
    constructor(
        @Inject(CHAT_CONFIG_REPOSITORY_PORT)
        private readonly repository: ChatConfigRepositoryPort,
    ) { }

    async execute(): Promise<ChatConfigResult> {
        const config = await this.repository.find();

        if (!config) {
            throw new ChatConfigNotFoundException();
        }

        return {
            isGlobalChatEnabled: config.isGlobalChatEnabled,
            maxMessageLength: config.maxMessageLength,
            defaultSlowModeSeconds: config.defaultSlowModeSeconds,
            minChatTierLevel: config.minChatTierLevel,
            blockDuplicateMessages: config.blockDuplicateMessages,
            updatedAt: config.updatedAt,
        };
    }
}

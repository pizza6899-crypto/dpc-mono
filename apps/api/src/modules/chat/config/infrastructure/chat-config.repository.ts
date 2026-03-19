import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import { type PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { ChatConfig } from '../domain/chat-config.entity';
import { ChatConfigRepositoryPort } from '../ports/chat-config.repository.port';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

@Injectable()
export class ChatConfigRepository implements ChatConfigRepositoryPort {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cacheService: CacheService,
  ) {}

  async find(): Promise<ChatConfig | null> {
    const record = await this.cacheService.getOrSet(
      CACHE_CONFIG.CHAT_CONFIG.GLOBAL,
      async () => {
        return await this.tx.chatConfig.findUnique({
          where: { id: ChatConfig.SINGLETON_ID },
        });
      },
    );

    return record ? ChatConfig.fromPersistence(record) : null;
  }

  async save(config: ChatConfig): Promise<void> {
    await this.tx.chatConfig.update({
      where: { id: ChatConfig.SINGLETON_ID },
      data: {
        isGlobalChatEnabled: config.isGlobalChatEnabled,
        maxMessageLength: config.maxMessageLength,
        defaultSlowModeSeconds: config.defaultSlowModeSeconds,
        minChatTierLevel: config.minChatTierLevel,
        blockDuplicateMessages: config.blockDuplicateMessages,
      },
    });

    // 저장 시 캐시 무효화
    await this.cacheService.del(CACHE_CONFIG.CHAT_CONFIG.GLOBAL);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectTransaction } from '@nestjs-cls/transactional';
import type { PrismaTransaction } from 'src/infrastructure/prisma/prisma.module';
import { QuestSystemConfigRepository } from '../ports/quest-system-config.repository.port';
import { QuestSystemConfig } from '../domain/quest-system-config.entity';
import { QuestSystemConfigMapper } from './quest-system-config.mapper';
import { CacheService } from 'src/common/cache/cache.service';
import { CACHE_CONFIG } from 'src/common/cache/cache.constants';

@Injectable()
export class PrismaQuestSystemConfigRepository implements QuestSystemConfigRepository {
  constructor(
    @InjectTransaction()
    private readonly tx: PrismaTransaction,
    private readonly cacheService: CacheService,
  ) {}

  async find(): Promise<QuestSystemConfig | null> {
    const record = await this.cacheService.getOrSet(
      CACHE_CONFIG.QUEST_CONFIG.GLOBAL,
      async () => {
        return await this.tx.questSystemConfig.findUnique({
          where: { id: QuestSystemConfig.DEFAULT_ID },
        });
      },
    );

    return record ? QuestSystemConfigMapper.toDomain(record) : null;
  }

  async save(config: QuestSystemConfig): Promise<void> {
    const data = QuestSystemConfigMapper.toPersistence(config);

    await this.tx.questSystemConfig.upsert({
      where: { id: QuestSystemConfig.DEFAULT_ID },
      update: data,
      create: {
        id: QuestSystemConfig.DEFAULT_ID,
        ...data,
      },
    });

    await this.cacheService.del(CACHE_CONFIG.QUEST_CONFIG.GLOBAL);
  }
}

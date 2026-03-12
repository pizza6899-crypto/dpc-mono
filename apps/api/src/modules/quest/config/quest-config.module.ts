import { Module } from '@nestjs/common';
import { QuestCoreModule } from '../core/quest-core.module';
import { PrismaQuestSystemConfigRepository } from './infrastructure/quest-system-config.repository';
import { QUEST_SYSTEM_CONFIG_REPOSITORY } from './ports/quest-system-config.repository.token';
import { QuestSystemConfigMapper } from './infrastructure/quest-system-config.mapper';
import { CacheModule } from 'src/common/cache/cache.module';
import { GetQuestConfigService } from './application/get-quest-config.service';
import { UpdateQuestConfigService } from './application/update-quest-config.service';
import { QuestConfigAdminController } from './controllers/admin/quest-config-admin.controller';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
  imports: [QuestCoreModule, CacheModule, ConcurrencyModule],
  controllers: [QuestConfigAdminController],
  providers: [
    {
      provide: QUEST_SYSTEM_CONFIG_REPOSITORY,
      useClass: PrismaQuestSystemConfigRepository,
    },
    QuestSystemConfigMapper,
    GetQuestConfigService,
    UpdateQuestConfigService,
  ],
  exports: [QUEST_SYSTEM_CONFIG_REPOSITORY, GetQuestConfigService],
})
export class QuestConfigModule { }

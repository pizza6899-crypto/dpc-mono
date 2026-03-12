import { Module } from '@nestjs/common';
import { QuestCoreModule } from '../core/quest-core.module';
import { CreateQuestAdminService } from './application/create-quest-admin.service';
import { UpdateQuestAdminService } from './application/update-quest-admin.service';
import { FindQuestsAdminService } from './application/find-quests-admin.service';
import { QuestAdminController } from './controllers/quest-admin.controller';

@Module({
  imports: [QuestCoreModule],
  controllers: [QuestAdminController],
  providers: [
    CreateQuestAdminService,
    UpdateQuestAdminService,
    FindQuestsAdminService,
  ],
})
export class QuestAdminModule { }

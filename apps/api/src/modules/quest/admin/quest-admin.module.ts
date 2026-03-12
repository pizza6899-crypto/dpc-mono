import { Module } from '@nestjs/common';
import { QuestCoreModule } from '../core/quest-core.module';
import { CreateQuestService } from './application/create-quest.service';
import { QuestAdminController } from './controllers/quest-admin.controller';

@Module({
  imports: [QuestCoreModule],
  controllers: [QuestAdminController],
  providers: [CreateQuestService],
})
export class QuestAdminModule { }

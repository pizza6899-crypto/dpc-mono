import { Module } from '@nestjs/common';
import { QuestCoreModule } from '../core/quest-core.module';
import { FindQuestsUserService } from './application/find-quests-user.service';
import { QuestUserController } from './controllers/quest-user.controller';
import { SqidsModule } from 'src/common/sqids/sqids.module';

@Module({
  imports: [QuestCoreModule, SqidsModule],
  controllers: [QuestUserController],
  providers: [FindQuestsUserService],
})
export class QuestUserModule {}

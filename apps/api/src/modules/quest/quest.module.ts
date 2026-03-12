import { Module } from '@nestjs/common';
import { QuestCoreModule } from './core/quest-core.module';
import { QuestConfigModule } from './config/quest-config.module';
import { QuestAdminModule } from './admin/quest-admin.module';
import { QuestUserModule } from './user/quest-user.module';
import { QuestEngineModule } from './engine/quest-engine.module';

@Module({
  imports: [
    QuestCoreModule,
    QuestConfigModule,
    QuestAdminModule,
    QuestUserModule,
    QuestEngineModule,
  ],
  exports: [
    QuestCoreModule,
    QuestConfigModule,
    QuestAdminModule,
    QuestUserModule,
    QuestEngineModule,
  ],
})
export class QuestModule { }

import { Module } from '@nestjs/common';
import { QuestCoreModule } from '../core/quest-core.module';

@Module({
  imports: [QuestCoreModule],
  providers: [],
})
export class QuestEngineModule {}

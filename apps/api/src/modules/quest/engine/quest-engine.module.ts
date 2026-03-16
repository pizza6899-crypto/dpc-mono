import { Module } from '@nestjs/common';
import { QuestCoreModule } from '../core/quest-core.module';
import { ProcessDepositQuestService } from './application/process-deposit-quest.service';
import { QUEST_ENGINE_PORT } from '../../deposit/ports/out/quest-engine.port';
import { ConcurrencyModule } from 'src/common/concurrency/concurrency.module';

@Module({
  imports: [
    QuestCoreModule,
    ConcurrencyModule,
  ],
  providers: [
    ProcessDepositQuestService,
    {
      provide: QUEST_ENGINE_PORT,
      useClass: ProcessDepositQuestService,
    },
  ],
  exports: [
    QuestCoreModule,
    ProcessDepositQuestService,
    QUEST_ENGINE_PORT,
  ],
})
export class QuestEngineModule {}

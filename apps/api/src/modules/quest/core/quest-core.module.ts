import { Module } from '@nestjs/common';
import { QUEST_MASTER_REPOSITORY_TOKEN } from './ports/quest-master.repository.token';
import { USER_QUEST_REPOSITORY_TOKEN } from './ports/user-quest.repository.token';
import { PrismaQuestMasterRepository } from './infrastructure/prisma-quest-master.repository';
import { PrismaUserQuestRepository } from './infrastructure/prisma-user-quest.repository';
import { HandleQuestActivityService } from './application/handle-quest-activity.service';
import { ClaimQuestRewardService } from './application/claim-quest-reward.service';

import { USER_QUEST_CONTEXT_PORT_TOKEN } from './ports/user-quest-context.port';
import { UserQuestContextAdapter } from './infrastructure/user-quest-context.adapter';

@Module({
  imports: [
  ],
  providers: [
    {
      provide: QUEST_MASTER_REPOSITORY_TOKEN,
      useClass: PrismaQuestMasterRepository,
    },
    {
      provide: USER_QUEST_REPOSITORY_TOKEN,
      useClass: PrismaUserQuestRepository,
    },
    {
      provide: USER_QUEST_CONTEXT_PORT_TOKEN,
      useClass: UserQuestContextAdapter,
    },
    HandleQuestActivityService,
    ClaimQuestRewardService,
  ],
  exports: [
    QUEST_MASTER_REPOSITORY_TOKEN,
    USER_QUEST_REPOSITORY_TOKEN,
    USER_QUEST_CONTEXT_PORT_TOKEN,
    HandleQuestActivityService,
    ClaimQuestRewardService,
  ],
})
export class QuestCoreModule { }

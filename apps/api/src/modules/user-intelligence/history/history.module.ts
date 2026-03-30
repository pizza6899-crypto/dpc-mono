import { Module } from '@nestjs/common';
import { SnowflakeModule } from '../../../infrastructure/snowflake/snowflake.module';
import { RecordScoreHistoryService } from './application/record-score-history.service';
import { GetUserIntelligenceHistoryService } from './application/get-user-intelligence-history.service';
import { PrismaHistoryRepository } from './infrastructure/prisma-history.repository';
import { HISTORY_REPOSITORY_PORT } from './ports/history-repository.port';

@Module({
  imports: [SnowflakeModule],
  providers: [
    RecordScoreHistoryService,
    GetUserIntelligenceHistoryService,
    {
      provide: HISTORY_REPOSITORY_PORT,
      useClass: PrismaHistoryRepository,
    },
  ],
  exports: [RecordScoreHistoryService, GetUserIntelligenceHistoryService],
})
export class HistoryModule { }

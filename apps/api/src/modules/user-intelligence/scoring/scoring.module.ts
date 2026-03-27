import { Module } from '@nestjs/common';
import { GetUserScoreService } from './application/get-user-score.service';
import { UpdateUserScoreService } from './application/update-user-score.service';
import { SearchUsersByScoreService } from './application/search-users-by-score.service';
import { PrismaScoreRepository } from './infrastructure/prisma-score.repository';
import { SCORE_REPOSITORY_PORT } from './ports/score-repository.port';

@Module({
  providers: [
    GetUserScoreService,
    UpdateUserScoreService,
    SearchUsersByScoreService,
    {
      provide: SCORE_REPOSITORY_PORT,
      useClass: PrismaScoreRepository,
    },
  ],
  exports: [GetUserScoreService, UpdateUserScoreService, SearchUsersByScoreService],
})
export class ScoringModule { }

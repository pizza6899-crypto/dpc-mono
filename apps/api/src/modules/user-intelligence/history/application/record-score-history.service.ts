import { Inject, Injectable } from '@nestjs/common';
import { SnowflakeService } from '../../../../infrastructure/snowflake/snowflake.service';
import { UserIntelligenceHistory } from '../domain/user-intelligence-history.entity';
import {
  HISTORY_REPOSITORY_PORT,
} from '../ports/history-repository.port';
import type { IUserIntelligenceHistoryRepositoryPort } from '../ports/history-repository.port';

export interface RecordScoreHistoryParams {
  userId: bigint;
  prevTotalScore: number;
  nextTotalScore: number;
  reason?: string;
}

/**
 * [History] 점수 변화 이력을 기록하는 서비스 (Command)
 * - 점수가 실제로 변경되었을 때만 이력을 생성합니다.
 * - 파티셔닝 대응을 위해 Snowflake ID를 사용합니다.
 */
@Injectable()
export class RecordScoreHistoryService {
  constructor(
    @Inject(HISTORY_REPOSITORY_PORT)
    private readonly historyRepo: IUserIntelligenceHistoryRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  async execute(params: RecordScoreHistoryParams): Promise<void> {
    // 점수 변화가 없으면 이력을 남기지 않음
    if (params.prevTotalScore === params.nextTotalScore) return;

    const { id: historyId, timestamp } = this.snowflakeService.generate();

    const history = UserIntelligenceHistory.create({
      id: historyId,
      userId: params.userId,
      prevTotalScore: params.prevTotalScore,
      nextTotalScore: params.nextTotalScore,
      reason: params.reason,
      createdAt: timestamp,
    });

    await this.historyRepo.save(history);
  }
}

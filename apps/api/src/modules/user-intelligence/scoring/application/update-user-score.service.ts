import { Inject, Injectable } from '@nestjs/common';
import { SCORE_REPOSITORY_PORT } from '../ports/score-repository.port';
import type { IScoreRepositoryPort, UpsertScoreParams } from '../ports/score-repository.port';
import { UserIntelligenceScore } from '../domain/user-intelligence-score.entity';

/**
 * [Scoring] 계산된 점수를 저장/갱신하는 서비스 (Command)
 * - metric 모듈의 RefreshUserIntelligenceService에서 호출됩니다.
 */
@Injectable()
export class UpdateUserScoreService {
  constructor(
    @Inject(SCORE_REPOSITORY_PORT)
    private readonly scoreRepo: IScoreRepositoryPort,
  ) { }

  /**
   * 점수 저장/갱신 후 엔티티 반환
   */
  async execute(params: UpsertScoreParams): Promise<UserIntelligenceScore> {
    return this.scoreRepo.upsert(params);
  }
}

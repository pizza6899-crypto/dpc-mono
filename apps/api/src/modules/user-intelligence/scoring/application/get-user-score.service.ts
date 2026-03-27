import { Inject, Injectable } from '@nestjs/common';
import { SCORE_REPOSITORY_PORT } from '../ports/score-repository.port';
import type { IScoreRepositoryPort } from '../ports/score-repository.port';
import { UserIntelligenceScore } from '../domain/user-intelligence-score.entity';
import { ScoreNotFoundException } from '../domain/scoring.errors';

/**
 * [Scoring] 특정 유저의 지능형 점수를 조회하는 서비스 (Query)
 */
@Injectable()
export class GetUserScoreService {
  constructor(
    @Inject(SCORE_REPOSITORY_PORT)
    private readonly scoreRepo: IScoreRepositoryPort,
  ) { }

  /**
   * 점수 엔티티 반환 (등급, 리스크비율 포함)
   * @throws ScoreNotFoundException
   */
  async execute(userId: bigint): Promise<UserIntelligenceScore> {
    const score = await this.scoreRepo.findByUserId(userId);
    if (!score) throw new ScoreNotFoundException();
    return score;
  }

  /**
   * 점수가 없어도 null 반환 (optional 조회)
   */
  async findOrNull(userId: bigint): Promise<UserIntelligenceScore | null> {
    return this.scoreRepo.findByUserId(userId);
  }
}

import { Inject, Injectable } from '@nestjs/common';
import { SCORE_REPOSITORY_PORT, ScoreSearchOptions } from '../ports/score-repository.port';
import type { IScoreRepositoryPort } from '../ports/score-repository.port';
import { UserIntelligenceScore } from '../domain/user-intelligence-score.entity';

export interface SearchScoreResult {
  items: UserIntelligenceScore[];
  total: number;
}

/**
 * [Scoring] 점수 범위 기반 유저 목록을 검색하는 서비스 (Query) — 어드민용
 */
@Injectable()
export class SearchUsersByScoreService {
  constructor(
    @Inject(SCORE_REPOSITORY_PORT)
    private readonly scoreRepo: IScoreRepositoryPort,
  ) { }

  async execute(options: ScoreSearchOptions): Promise<SearchScoreResult> {
    const [items, total] = await this.scoreRepo.findAndCountByScoreRange(options);
    return { items, total };
  }
}

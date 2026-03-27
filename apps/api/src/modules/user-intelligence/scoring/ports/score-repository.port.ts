import type { UserIntelligenceScore } from '../domain/user-intelligence-score.entity';

export interface UpsertScoreParams {
  userId: bigint;
  totalScore: number;
  valueScore: number;
  riskScore: number;
  scoreValueIndex: number;
  scoreDepositAmount: number;
  scoreDepositCount: number;
  scoreRolling: number;
  scoreBehavior: number;
  scoreRiskPromotion: number;
  scoreRiskTechnical: number;
  scoreRiskBehavior: number;
  details?: Record<string, unknown>;
}

export interface ScoreSearchOptions {
  minTotal?: number;
  maxTotal?: number;
  skip?: number;
  take?: number;
}

export interface IScoreRepositoryPort {
  /**
   * 현재 점수 조회
   */
  findByUserId(userId: bigint): Promise<UserIntelligenceScore | null>;

  /**
   * 점수 저장/갱신 (Upsert)
   */
  upsert(params: UpsertScoreParams): Promise<UserIntelligenceScore>;

  /**
   * 점수 범위 기반 유저 목록 조회 (어드민 검색용)
   */
  findAndCountByScoreRange(options: ScoreSearchOptions): Promise<[UserIntelligenceScore[], number]>;
}

export const SCORE_REPOSITORY_PORT = Symbol('SCORE_REPOSITORY_PORT');

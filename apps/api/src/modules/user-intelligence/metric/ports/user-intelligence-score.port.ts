import { Prisma } from '@prisma/client';

export interface IUserIntelligenceScorePort {
  /**
   * 점수 저장 (Upsert)
   */
  upsertScore(data: Prisma.UserIntelligenceScoreUncheckedCreateInput): Promise<Prisma.UserIntelligenceScoreGetPayload<{}>>;

  /**
   * 기초 통계(Metric) 저장 (Upsert)
   */
  upsertMetric(data: Prisma.UserIntelligenceMetricUncheckedCreateInput): Promise<Prisma.UserIntelligenceMetricGetPayload<{}>>;

  /**
   * 점수 변경 이력 추가
   */
  addHistory(data: Prisma.UserIntelligenceHistoryUncheckedCreateInput): Promise<Prisma.UserIntelligenceHistoryGetPayload<{}>>;

  /**
   * 현재 점수 조회
   */
  findCurrentScore(userId: bigint): Promise<Prisma.UserIntelligenceScoreGetPayload<{}> | null>;
}

export const USER_INTELLIGENCE_SCORE_PORT = Symbol('USER_INTELLIGENCE_SCORE_PORT');

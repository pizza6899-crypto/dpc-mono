import { Prisma } from '@prisma/client';

/**
 * 유저 원천 지표(Metric)를 저장하는 포트
 * (점수 계산과 무관한 원천 데이터 스냅샷)
 */
export interface IUserMetricRepositoryPort {
  upsertMetric(data: Prisma.UserIntelligenceMetricUncheckedCreateInput): Promise<Prisma.UserIntelligenceMetricGetPayload<{}>>;
}

export const USER_METRIC_REPOSITORY_PORT = Symbol('USER_METRIC_REPOSITORY_PORT');

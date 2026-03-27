import type { UserIntelligenceHistory } from '../domain/user-intelligence-history.entity';

export interface HistoryFindOptions {
  userId: bigint;
  startDate?: Date;
  endDate?: Date;
  skip?: number;
  take?: number;
}

export interface IUserIntelligenceHistoryRepositoryPort {
  /**
   * 이력 저장
   */
  save(history: UserIntelligenceHistory): Promise<UserIntelligenceHistory>;

  /**
   * 유저의 이력 목록 조회 (페이징)
   */
  findAndCount(options: HistoryFindOptions): Promise<[UserIntelligenceHistory[], number]>;
}

export const HISTORY_REPOSITORY_PORT = Symbol('HISTORY_REPOSITORY_PORT');

import type { UserSession } from '../../domain';
import type { SessionType, SessionStatus } from '../../domain';

export interface FindSessionsParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastActiveAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  userId?: bigint;
  status?: SessionStatus;
  type?: SessionType;
  activeOnly?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface FindSessionsResult {
  sessions: UserSession[];
  total: number;
}

export interface UserSessionRepositoryPort {
  /**
   * 세션 생성
   */
  create(session: UserSession): Promise<UserSession>;

  /**
   * 세션 ID로 조회
   */
  findBySessionId(sessionId: string): Promise<UserSession | null>;

  /**
   * 사용자의 활성 세션 목록 조회
   */
  findActiveByUserId(userId: bigint): Promise<UserSession[]>;

  /**
   * 사용자의 모든 세션 목록 조회 (활성/비활성 포함)
   */
  findByUserId(userId: bigint): Promise<UserSession[]>;

  /**
   * 세션 목록 조회 (필터링, 페이징 지원)
   */
  findMany(params: FindSessionsParams): Promise<FindSessionsResult>;

  /**
   * 세션 업데이트
   */
  update(session: UserSession): Promise<UserSession>;

  /**
   * 세션 삭제
   */
  delete(sessionId: string): Promise<void>;

  /**
   * 만료된 세션 목록 조회
   * @param limit - 최대 조회 개수
   */
  findExpiredSessions(limit: number): Promise<UserSession[]>;

  /**
   * 만료된 세션 일괄 삭제
   * @param beforeDate - 이 날짜 이전의 만료된 세션 삭제
   * @returns 삭제된 세션 수
   */
  deleteExpiredSessions(beforeDate: Date): Promise<number>;
}

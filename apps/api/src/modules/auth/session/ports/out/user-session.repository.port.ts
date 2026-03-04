import type { UserSession } from '../../domain';
import type { SessionType, SessionStatus } from '../../domain';
import type { AuthenticatedUser } from 'src/common/auth/types/auth.types';

export interface FindSessionsParams {
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'lastActiveAt' | 'expiresAt';
  sortOrder?: 'asc' | 'desc';
  userId?: bigint;
  status?: SessionStatus;
  type?: SessionType;
  parentSessionId?: string | null;
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
   * 부모 세션에 연결된 모든 활성 자식 세션(소켓 등) 조회
   * @param parentSessionId - 부모 HTTP 세터 ID
   */
  findActiveByParentSessionId(parentSessionId: string): Promise<UserSession[]>;

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

  /**
   * Redis 세션 데이터 업데이트
   * @param sessionId - 실제 세션 ID (Express session ID)
   * @param isAdmin - 관리자 세션 여부 (상태에 따라 Redis prefix 결정)
   * @param updateData - 업데이트할 유저 데이터
   */
  updateRedisSessionData(
    sessionId: string,
    isAdmin: boolean,
    updateData: Partial<AuthenticatedUser>,
  ): Promise<void>;
}

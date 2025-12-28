// src/modules/auth/credential/ports/out/login-attempt.repository.port.ts
import type {
  LoginAttempt,
  LoginAttemptResult,
  LoginFailureReason,
} from '../../domain';

/**
 * 로그인 시도 필터 옵션
 */
export interface LoginAttemptFilters {
  userId?: string;
  result?: LoginAttemptResult;
  failureReason?: LoginFailureReason;
  isAdmin?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  email?: string;
}

/**
 * 목록 조회 옵션 (페이지네이션, 정렬)
 */
export interface ListOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'attemptedAt'; // LoginAttempt는 attemptedAt 필드만 있음
  orderDirection?: 'asc' | 'desc';
}

/**
 * LoginAttempt Repository Port (Outbound Port)
 * 로그인 시도 데이터 접근 인터페이스
 */
export interface LoginAttemptRepositoryPort {
  /**
   * 로그인 시도 생성
   * @param attempt - 로그인 시도 엔티티
   * @returns 생성된 로그인 시도 엔티티
   */
  create(attempt: LoginAttempt): Promise<LoginAttempt>;

  /**
   * 로그인 시도 UID로 조회 (기본)
   * @param uid - 로그인 시도 UID (CUID)
   * @returns 로그인 시도 엔티티 또는 null
   */
  findByUid(uid: string): Promise<LoginAttempt | null>;

  /**
   * 로그인 시도 UID로 조회 (없으면 예외) (기본)
   * @param uid - 로그인 시도 UID (CUID)
   * @returns 로그인 시도 엔티티
   * @throws {LoginAttemptNotFoundException} 로그인 시도가 없는 경우
   */
  getByUid(uid: string): Promise<LoginAttempt>;

  /**
   * 로그인 시도 ID로 조회 (어드민 전용)
   * @param id - 로그인 시도 ID (BigInt)
   * @returns 로그인 시도 엔티티 또는 null
   */
  findById(id: bigint): Promise<LoginAttempt | null>;

  /**
   * 로그인 시도 ID로 조회 (없으면 예외) (어드민 전용)
   * @param id - 로그인 시도 ID (BigInt)
   * @returns 로그인 시도 엔티티
   * @throws {LoginAttemptNotFoundException} 로그인 시도가 없는 경우
   */
  getById(id: bigint): Promise<LoginAttempt>;

  /**
   * 사용자별 로그인 시도 목록 조회
   * @param userId - 사용자 ID
   * @param options - 조회 옵션 (페이지네이션, 정렬)
   * @returns 로그인 시도 엔티티 배열
   */
  listByUserId(userId: string, options?: ListOptions): Promise<LoginAttempt[]>;

  /**
   * 필터 조건으로 로그인 시도 목록 조회
   * @param filters - 필터 조건
   * @param options - 조회 옵션 (페이지네이션, 정렬)
   * @returns 로그인 시도 엔티티 배열
   */
  listByFilters(
    filters: LoginAttemptFilters,
    options?: ListOptions,
  ): Promise<LoginAttempt[]>;

  /**
   * 필터 조건으로 로그인 시도 개수 조회
   * @param filters - 필터 조건
   * @returns 로그인 시도 개수
   */
  countByFilters(filters: LoginAttemptFilters): Promise<number>;

  /**
   * 특정 IP 주소의 최근 실패한 로그인 시도 개수 조회
   * @param ipAddress - IP 주소
   * @param timeWindowMinutes - 시간 창 (분 단위, 기본값: 15분)
   * @returns 실패한 로그인 시도 개수
   */
  countRecentFailuresByIp(
    ipAddress: string,
    timeWindowMinutes?: number,
  ): Promise<number>;

  /**
   * 특정 이메일의 최근 실패한 로그인 시도 개수 조회
   * @param email - 이메일 주소
   * @param timeWindowMinutes - 시간 창 (분 단위, 기본값: 15분)
   * @returns 실패한 로그인 시도 개수
   */
  countRecentFailuresByEmail(
    email: string,
    timeWindowMinutes?: number,
  ): Promise<number>;
}

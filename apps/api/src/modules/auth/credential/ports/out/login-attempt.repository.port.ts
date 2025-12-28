import type { LoginAttempt } from '../../domain';

export interface LoginAttemptRepositoryPort {
  /**
   * 로그인 시도 기록 생성
   */
  create(attempt: LoginAttempt): Promise<LoginAttempt>;

  /**
   * UID로 로그인 시도 조회
   */
  findByUid(uid: string): Promise<LoginAttempt | null>;

  /**
   * UID로 로그인 시도 조회 (없을 경우 예외 발생)
   */
  getByUid(uid: string): Promise<LoginAttempt>;

  /**
   * ID로 로그인 시도 조회 (어드민 전용)
   */
  findById(id: bigint): Promise<LoginAttempt | null>;

  /**
   * ID로 로그인 시도 조회 (없을 경우 예외 발생, 어드민 전용)
   */
  getById(id: bigint): Promise<LoginAttempt>;

  /**
   * 최근 로그인 시도 목록 조회
   */
  listRecent(params: {
    email?: string;
    ipAddress?: string;
    limit: number;
  }): Promise<LoginAttempt[]>;
}

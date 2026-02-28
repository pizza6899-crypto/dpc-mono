import type { LoginAttempt } from '../../domain';

export interface LoginAttemptRepositoryPort {
  /**
   * 로그인 시도 기록 생성
   */
  create(attempt: LoginAttempt): Promise<LoginAttempt>;

  /**
   * 최근 로그인 시도 목록 조회
   */
  listRecent(params: {
    loginId?: string;
    ipAddress?: string;
    limit: number;
  }): Promise<LoginAttempt[]>;
}

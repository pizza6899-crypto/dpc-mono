import { Injectable } from '@nestjs/common';
import { LoginAttempt, LoginAttemptResult } from './model/login-attempt.entity';

/**
 * Credential 도메인 정책
 *
 * 로그인 시도 및 자격 증명 관련 비즈니스 규칙을 담당합니다.
 */
@Injectable()
export class CredentialPolicy {
  private readonly MAX_LOGIN_ATTEMPTS = 5;

  /**
   * 계정이 잠겼는지 확인하는 정책
   *
   * 최근 연속된 N번의 시도가 모두 실패했는지 확인합니다.
   * @param recentAttempts - 최근 로그인 시도 목록 (attemptedAt 기준 내림차순 정렬되어 있어야 함)
   * @returns 계정이 잠겼으면 true, 아니면 false
   */
  isAccountLocked(recentAttempts: LoginAttempt[]): boolean {
    // 최근 시도가 최대 시도 횟수보다 적으면 잠기지 않음
    if (recentAttempts.length < this.MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    // 최근 연속된 N번의 시도가 모두 실패했는지 확인
    // recentAttempts는 attemptedAt 기준 내림차순으로 정렬되어 있다고 가정
    const recentNAttempts = recentAttempts.slice(0, this.MAX_LOGIN_ATTEMPTS);
    const allFailed = recentNAttempts.every(
      (attempt) => attempt.result === LoginAttemptResult.FAILED,
    );

    return allFailed;
  }
}

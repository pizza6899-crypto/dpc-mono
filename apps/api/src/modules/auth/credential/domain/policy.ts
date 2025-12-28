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
   * (최근 실패 시도 횟수를 기반으로 판단)
   */
  isAccountLocked(recentAttempts: LoginAttempt[]): boolean {
    if (recentAttempts.length < this.MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    // 최근 연속된 N번의 시도가 모두 실패했는지 확인
    const failedCount = recentAttempts.filter(
      (attempt) => attempt.result === LoginAttemptResult.FAILED,
    ).length;

    return failedCount >= this.MAX_LOGIN_ATTEMPTS;
  }
}

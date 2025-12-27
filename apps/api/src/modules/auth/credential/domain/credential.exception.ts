// src/modules/auth/credential/domain/credential.exception.ts

/**
 * Credential 도메인 예외 기본 클래스
 */
export class CredentialException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CredentialException';
  }
}

/**
 * 로그인 시도 기록을 찾을 수 없는 경우
 */
export class LoginAttemptNotFoundException extends CredentialException {
  constructor(id?: bigint | string) {
    super(id ? `Login attempt '${id}' not found` : 'Login attempt not found');
    this.name = 'LoginAttemptNotFoundException';
  }
}

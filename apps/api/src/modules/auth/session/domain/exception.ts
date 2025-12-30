/**
 * Session 도메인 예외
 */

/**
 * 다중 로그인 제한 예외
 * 정책상 다중 로그인이 허용되지 않을 때 발생
 */
export class MultipleLoginNotAllowedException extends Error {
  constructor(
    public readonly existingSessionCount: number,
    message?: string,
  ) {
    super(
      message ??
        `Multiple login is not allowed. You have ${existingSessionCount} active session(s).`,
    );
    this.name = 'MultipleLoginNotAllowedException';
  }
}

/**
 * 세션을 찾을 수 없을 때 발생하는 예외
 */
export class SessionNotFoundException extends Error {
  constructor(public readonly sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = 'SessionNotFoundException';
  }
}

/**
 * 세션 소유자가 아닐 때 발생하는 예외
 */
export class SessionOwnershipException extends Error {
  constructor(
    public readonly sessionId: string,
    public readonly userId: bigint,
  ) {
    super(
      `User ${userId} does not own session ${sessionId}`,
    );
    this.name = 'SessionOwnershipException';
  }
}


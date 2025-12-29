// src/modules/auth/credential/domain/model/login-attempt.entity.ts

/**
 * 로그인 시도 결과
 */
export enum LoginAttemptResult {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

/**
 * 로그인 실패 이유
 */
export enum LoginFailureReason {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_CLOSED = 'ACCOUNT_CLOSED',
  THROTTLE_LIMIT_EXCEEDED = 'THROTTLE_LIMIT_EXCEEDED',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 로그인 시도 엔티티
 *
 * 보안 및 감사 목적으로 로그인 시도를 기록합니다.
 * - 성공/실패 여부 추적
 * - IP 주소, User Agent 등 보안 정보 기록
 * - 실패 이유 추적 (보안 정책 적용)
 */
export class LoginAttempt {
  private constructor(
    public readonly id: bigint | null, // 내부 관리용 (DB 저장 시 자동 생성)
    public readonly uid: string, // 비즈니스용 (CUID2)
    public readonly userId: bigint | null, // 시도한 사용자 ID (알 수 있는 경우)
    public readonly result: LoginAttemptResult,
    public readonly failureReason: LoginFailureReason | null, // 실패한 경우에만 값 존재
    public readonly ipAddress: string | null,
    public readonly userAgent: string | null,
    public readonly deviceFingerprint: string | null,
    public readonly isMobile: boolean | null,
    public readonly attemptedAt: Date,
    public readonly email: string | null, // 시도한 이메일
    public readonly isAdmin: boolean, // 관리자 로그인 시도 여부
  ) {}

  /**
   * 성공한 로그인 시도 생성
   */
  static createSuccess(params: {
    uid: string;
    userId: bigint;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceFingerprint?: string | null;
    isMobile?: boolean | null;
    email?: string | null;
    isAdmin?: boolean;
    attemptedAt?: Date;
  }): LoginAttempt {
    return new LoginAttempt(
      null,
      params.uid,
      params.userId,
      LoginAttemptResult.SUCCESS,
      null,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.deviceFingerprint ?? null,
      params.isMobile ?? null,
      params.attemptedAt ?? new Date(),
      params.email ?? null,
      params.isAdmin ?? false,
    );
  }

  /**
   * 실패한 로그인 시도 생성
   * @description userId를 알 수 있는 경우(예: 패스포트 검증 중 사용자 발견 후 비번 틀림) 함께 기록하면 보안 정책 적용에 유리합니다.
   */
  static createFailure(params: {
    uid: string;
    failureReason: LoginFailureReason;
    userId?: bigint | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceFingerprint?: string | null;
    isMobile?: boolean | null;
    email?: string | null;
    isAdmin?: boolean;
    attemptedAt?: Date;
  }): LoginAttempt {
    return new LoginAttempt(
      null,
      params.uid,
      params.userId ?? null,
      LoginAttemptResult.FAILED,
      params.failureReason,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      params.deviceFingerprint ?? null,
      params.isMobile ?? null,
      params.attemptedAt ?? new Date(),
      params.email ?? null,
      params.isAdmin ?? false,
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   * @throws {Error} result 또는 failureReason이 유효한 enum 값이 아닌 경우
   */
  static fromPersistence(data: {
    id: bigint | null;
    uid: string;
    userId: bigint | null;
    result: string;
    failureReason: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    deviceFingerprint: string | null;
    isMobile: boolean | null;
    attemptedAt: Date;
    email: string | null;
    isAdmin: boolean;
  }): LoginAttempt {
    // result enum 값 검증
    if (
      data.result !== LoginAttemptResult.SUCCESS &&
      data.result !== LoginAttemptResult.FAILED
    ) {
      throw new Error(
        `Invalid LoginAttemptResult: ${data.result}. Expected SUCCESS or FAILED`,
      );
    }

    // failureReason enum 값 검증 (null이 아닌 경우에만)
    if (data.failureReason !== null) {
      const validReasons = Object.values(LoginFailureReason);
      if (!validReasons.includes(data.failureReason as LoginFailureReason)) {
        throw new Error(
          `Invalid LoginFailureReason: ${data.failureReason}. Expected one of: ${validReasons.join(', ')}`,
        );
      }
    }

    // 비즈니스 규칙 검증: 성공한 경우 failureReason은 null이어야 함
    if (
      data.result === LoginAttemptResult.SUCCESS &&
      data.failureReason !== null
    ) {
      throw new Error('LoginAttemptResult.SUCCESS cannot have a failureReason');
    }

    // 비즈니스 규칙 검증: 실패한 경우 failureReason은 필수
    if (
      data.result === LoginAttemptResult.FAILED &&
      data.failureReason === null
    ) {
      throw new Error('LoginAttemptResult.FAILED must have a failureReason');
    }

    return new LoginAttempt(
      data.id,
      data.uid,
      data.userId,
      data.result as LoginAttemptResult,
      data.failureReason as LoginFailureReason | null,
      data.ipAddress,
      data.userAgent,
      data.deviceFingerprint,
      data.isMobile,
      data.attemptedAt,
      data.email,
      data.isAdmin,
    );
  }

  // Business Logic Methods
  isSuccess(): boolean {
    return this.result === LoginAttemptResult.SUCCESS;
  }

  isFailure(): boolean {
    return this.result === LoginAttemptResult.FAILED;
  }

  hasFailureReason(reason: LoginFailureReason): boolean {
    return this.failureReason === reason;
  }

  /**
   * Persistence 레이어로 변환
   */
  toPersistence() {
    return {
      id: this.id,
      uid: this.uid,
      userId: this.userId,
      result: this.result,
      failureReason: this.failureReason,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      deviceFingerprint: this.deviceFingerprint,
      isMobile: this.isMobile,
      attemptedAt: this.attemptedAt,
      email: this.email,
      isAdmin: this.isAdmin,
    };
  }
}

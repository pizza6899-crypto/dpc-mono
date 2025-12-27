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
    public readonly uid: string | null, // 비즈니스용 (CUID2, DB 저장 시 자동 생성)
    public readonly userId: string | null, // 성공한 경우 사용자 ID, 실패한 경우 null
    private _result: LoginAttemptResult,
    private _failureReason: LoginFailureReason | null, // 실패한 경우에만 값 존재
    private readonly _ipAddress: string | null,
    private readonly _userAgent: string | null,
    private readonly _deviceFingerprint: string | null,
    private readonly _isMobile: boolean | null,
    public readonly attemptedAt: Date,
    public readonly email: string | null, // 시도한 이메일 (보안 목적)
    public readonly isAdmin: boolean, // 관리자 로그인 시도 여부
  ) {}

  /**
   * 성공한 로그인 시도 생성
   * @param params - 로그인 시도 파라미터
   * @returns 생성된 로그인 시도 엔티티
   * @description 새 엔티티 생성 시 id=null, uid는 애플리케이션에서 CUID 생성하여 전달 필수
   */
  static createSuccess(params: {
    uid: string; // 필수: 애플리케이션에서 CUID 생성하여 전달 (IdUtil.generateUid() 사용)
    userId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceFingerprint?: string | null;
    isMobile?: boolean | null;
    email?: string | null;
    isAdmin?: boolean;
    attemptedAt?: Date;
  }): LoginAttempt {
    return new LoginAttempt(
      null, // 새 엔티티는 id가 null
      params.uid,
      params.userId,
      LoginAttemptResult.SUCCESS,
      null, // 성공한 경우 실패 이유 없음
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
   * @param params - 로그인 시도 파라미터
   * @returns 생성된 로그인 시도 엔티티
   * @description 새 엔티티 생성 시 id=null, uid는 애플리케이션에서 CUID 생성하여 전달 필수
   */
  static createFailure(params: {
    uid: string; // 필수: 애플리케이션에서 CUID 생성하여 전달 (IdUtil.generateUid() 사용)
    failureReason: LoginFailureReason;
    ipAddress?: string | null;
    userAgent?: string | null;
    deviceFingerprint?: string | null;
    isMobile?: boolean | null;
    email?: string | null;
    isAdmin?: boolean;
    attemptedAt?: Date;
  }): LoginAttempt {
    return new LoginAttempt(
      null, // 새 엔티티는 id가 null
      params.uid,
      null, // 실패한 경우 userId 없음
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
   * Repository에서 Prisma를 통해 생성/조회된 데이터를 Domain Entity로 변환할 때 사용
   * @description 영속화된 엔티티는 id와 uid 모두 보유
   */
  static fromPersistence(data: {
    id: bigint | null;
    uid: string; // 영속화된 엔티티는 항상 uid 보유
    userId: string | null;
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

  // Getters
  get result(): LoginAttemptResult {
    return this._result;
  }

  get failureReason(): LoginFailureReason | null {
    return this._failureReason;
  }

  get ipAddress(): string | null {
    return this._ipAddress;
  }

  get userAgent(): string | null {
    return this._userAgent;
  }

  get deviceFingerprint(): string | null {
    return this._deviceFingerprint;
  }

  get isMobile(): boolean | null {
    return this._isMobile;
  }

  // Business Logic Methods
  /**
   * 로그인 시도가 성공했는지 확인
   */
  isSuccess(): boolean {
    return this._result === LoginAttemptResult.SUCCESS;
  }

  /**
   * 로그인 시도가 실패했는지 확인
   */
  isFailure(): boolean {
    return this._result === LoginAttemptResult.FAILED;
  }

  /**
   * 특정 실패 이유로 실패했는지 확인
   */
  hasFailureReason(reason: LoginFailureReason): boolean {
    return this._failureReason === reason;
  }

  /**
   * Persistence 레이어로 변환
   */
  toPersistence() {
    return {
      id: this.id,
      uid: this.uid,
      userId: this.userId,
      result: this._result,
      failureReason: this._failureReason,
      ipAddress: this._ipAddress,
      userAgent: this._userAgent,
      deviceFingerprint: this._deviceFingerprint,
      isMobile: this._isMobile,
      attemptedAt: this.attemptedAt,
      email: this.email,
      isAdmin: this.isAdmin,
    };
  }
}

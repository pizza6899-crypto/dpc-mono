import { SessionType } from './session-type.enum';
import { SessionStatus } from './session-status.enum';
import { DeviceInfo } from './device-info.vo';

/**
 * 사용자 세션 엔티티
 *
 * 사용자의 활성 세션을 추적하고 관리합니다.
 * - HTTP 세션 및 WebSocket 세션 모두 추적
 * - 여러 디바이스에서의 동시 로그인 지원
 * - 세션 생명주기 관리 (생성, 활성화, 만료, 종료)
 * - 디바이스 정보 및 메타데이터 저장
 */
export class UserSession {
  private constructor(
    public readonly id: bigint | null, // 내부 관리용 (DB 저장 시 자동 생성)
    public readonly userId: bigint, // 세션 소유자 사용자 ID
    public readonly sessionId: string, // 실제 세션 ID (Express session ID 또는 Socket.io socket ID)
    public readonly parentSessionId: string | null, // 부모 세션 ID (HTTP 세션에서 파생된 소켓인 경우)
    public readonly type: SessionType, // 세션 타입 (HTTP, WEBSOCKET 등)
    public readonly status: SessionStatus, // 세션 상태
    public readonly isAdmin: boolean, // 관리자 세션 여부 (HTTP 세션인 경우 Redis 키 prefix 결정에 사용)
    public readonly deviceInfo: DeviceInfo, // 디바이스 정보
    public readonly createdAt: Date, // 세션 생성 시간
    public readonly updatedAt: Date, // 마지막 업데이트 시간
    public readonly lastActiveAt: Date, // 마지막 활동 시간
    public readonly expiresAt: Date, // 세션 만료 시간
    public readonly revokedAt: Date | null, // 세션 종료 시간 (REVOKED 상태일 때)
    public readonly revokedBy: bigint | null, // 세션을 종료한 사용자 ID (관리자가 종료한 경우)
    public readonly metadata: Record<string, unknown>, // 추가 메타데이터 (JSON)
  ) { }

  /**
   * 새로운 활성 세션 생성
   *
   * @param params - 세션 생성 파라미터
   * @param params.userId - 세션 소유자 사용자 ID
   * @param params.sessionId - 실제 세션 ID
   * @param params.parentSessionId - 부모 세션 ID (선택)
   * @param params.type - 세션 타입
   * @param params.deviceInfo - 디바이스 정보
   * @param params.expiresAt - 세션 만료 시간
   * @param params.metadata - 추가 메타데이터 (선택)
   */
  static create(params: {
    userId: bigint;
    sessionId: string;
    parentSessionId?: string | null;
    type: SessionType;
    isAdmin?: boolean;
    deviceInfo: DeviceInfo;
    expiresAt: Date;
    metadata?: Record<string, unknown>;
    createdAt?: Date;
  }): UserSession {
    const now = params.createdAt ?? new Date();

    return new UserSession(
      null, // id는 DB 저장 시 자동 생성
      params.userId,
      params.sessionId,
      params.parentSessionId ?? null,
      params.type,
      SessionStatus.ACTIVE,
      params.isAdmin ?? false,
      params.deviceInfo,
      now,
      now,
      now, // lastActiveAt도 초기에는 생성 시간과 동일
      params.expiresAt,
      null, // revokedAt
      null, // revokedBy
      params.metadata ?? {},
    );
  }

  /**
   * DB에서 조회한 데이터로부터 엔티티 생성
   *
   * @throws {Error} type, status가 유효한 enum 값이 아닌 경우
   */
  static fromPersistence(data: {
    id: bigint | null;
    userId: bigint;
    sessionId: string;
    parentSessionId: string | null;
    type: string;
    status: string;
    isAdmin: boolean;
    ipAddress: string | null;
    userAgent: string | null;
    deviceFingerprint: string | null;
    isMobile: boolean | null;
    deviceName: string | null;
    os: string | null;
    browser: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
    revokedBy: bigint | null;
    metadata: Record<string, unknown> | null;
  }): UserSession {
    // type enum 값 검증
    if (!Object.values(SessionType).includes(data.type as SessionType)) {
      throw new Error(
        `Invalid SessionType: ${data.type}. Expected one of: ${Object.values(SessionType).join(', ')}`,
      );
    }

    // status enum 값 검증
    if (!Object.values(SessionStatus).includes(data.status as SessionStatus)) {
      throw new Error(
        `Invalid SessionStatus: ${data.status}. Expected one of: ${Object.values(SessionStatus).join(', ')}`,
      );
    }

    const deviceInfo = DeviceInfo.fromPersistence({
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      deviceFingerprint: data.deviceFingerprint,
      isMobile: data.isMobile,
      deviceName: data.deviceName,
      os: data.os,
      browser: data.browser,
    });

    return new UserSession(
      data.id,
      data.userId,
      data.sessionId,
      data.parentSessionId,
      data.type as SessionType,
      data.status as SessionStatus,
      data.isAdmin,
      deviceInfo,
      data.createdAt,
      data.updatedAt,
      data.lastActiveAt,
      data.expiresAt,
      data.revokedAt,
      data.revokedBy,
      data.metadata ?? {},
    );
  }

  // Business Logic Methods

  /**
   * 세션이 활성 상태인지 확인
   */
  isActive(): boolean {
    return this.status === SessionStatus.ACTIVE && !this.isExpired();
  }

  /**
   * 세션이 만료되었는지 확인
   */
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * 세션이 종료되었는지 확인 (명시적 종료 또는 만료)
   */
  isTerminated(): boolean {
    return (
      this.status === SessionStatus.REVOKED ||
      this.status === SessionStatus.EXPIRED ||
      this.isExpired()
    );
  }

  /**
   * 세션 활동 시간 업데이트
   * 새로운 UserSession 인스턴스를 반환 (불변성 유지)
   */
  updateActivity(): UserSession {
    if (this.isTerminated()) {
      return this; // 종료된 세션은 업데이트 불가
    }

    const now = new Date();

    return new UserSession(
      this.id,
      this.userId,
      this.sessionId,
      this.parentSessionId,
      this.type,
      this.status,
      this.isAdmin,
      this.deviceInfo,
      this.createdAt,
      now, // updatedAt 갱신
      now, // lastActiveAt 갱신
      this.expiresAt,
      this.revokedAt,
      this.revokedBy,
      this.metadata,
    );
  }

  /**
   * 세션 종료 (명시적 종료)
   * 새로운 UserSession 인스턴스를 반환 (불변성 유지)
   *
   * @param revokedBy - 세션을 종료한 사용자 ID (관리자가 종료한 경우)
   */
  revoke(revokedBy: bigint | null = null): UserSession {
    if (this.isTerminated()) {
      return this; // 이미 종료된 세션
    }

    const now = new Date();

    return new UserSession(
      this.id,
      this.userId,
      this.sessionId,
      this.parentSessionId,
      this.type,
      SessionStatus.REVOKED,
      this.isAdmin,
      this.deviceInfo,
      this.createdAt,
      now,
      this.lastActiveAt,
      this.expiresAt,
      now, // revokedAt 설정
      revokedBy, // revokedBy 설정
      this.metadata,
    );
  }

  /**
   * 세션 만료 처리
   * 새로운 UserSession 인스턴스를 반환 (불변성 유지)
   */
  expire(): UserSession {
    if (this.status !== SessionStatus.ACTIVE) {
      return this; // 이미 종료된 세션
    }

    return new UserSession(
      this.id,
      this.userId,
      this.sessionId,
      this.parentSessionId,
      this.type,
      SessionStatus.EXPIRED,
      this.isAdmin,
      this.deviceInfo,
      this.createdAt,
      new Date(),
      this.lastActiveAt,
      this.expiresAt,
      null, // revokedAt은 null (자동 만료)
      null, // revokedBy도 null
      this.metadata,
    );
  }

  /**
   * 메타데이터 업데이트
   * 새로운 UserSession 인스턴스를 반환 (불변성 유지)
   */
  updateMetadata(metadata: Record<string, unknown>): UserSession {
    return new UserSession(
      this.id,
      this.userId,
      this.sessionId,
      this.parentSessionId,
      this.type,
      this.status,
      this.isAdmin,
      this.deviceInfo,
      this.createdAt,
      new Date(),
      this.lastActiveAt,
      this.expiresAt,
      this.revokedAt,
      this.revokedBy,
      { ...this.metadata, ...metadata }, // 기존 메타데이터와 병합
    );
  }

  /**
   * 세션 타입 확인
   */
  isHttpSession(): boolean {
    return this.type === SessionType.HTTP;
  }

  isWebSocketSession(): boolean {
    return this.type === SessionType.WEBSOCKET;
  }

  /**
   * Persistence 레이어로 변환
   */
  toPersistence() {
    const deviceInfo = this.deviceInfo.toPersistence();

    return {
      id: this.id,
      userId: this.userId,
      sessionId: this.sessionId,
      parentSessionId: this.parentSessionId,
      type: this.type,
      status: this.status,
      isAdmin: this.isAdmin,
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
      deviceFingerprint: deviceInfo.deviceFingerprint,
      isMobile: deviceInfo.isMobile,
      deviceName: deviceInfo.deviceName,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastActiveAt: this.lastActiveAt,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAt,
      revokedBy: this.revokedBy,
      metadata: this.metadata,
    };
  }
}

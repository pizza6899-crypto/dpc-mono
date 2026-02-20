export enum LogType {
  AUTH = 'AUTH',
  ACTIVITY = 'ACTIVITY',
  ERROR = 'ERROR',
  INTEGRATION = 'INTEGRATION',
}

/**
 * Auth Log Payload
 *
 * @note action, status는 string으로 유지하여 결합성을 낮춤
 * 각 모듈에서 자체 enum을 정의하고 사용 (예: AuthAction, AuthStatus)
 * audit-log 모듈은 비즈니스 로직에 의존하지 않는 범용 인프라로 유지
 */
export interface AuthLogPayload {
  userId?: string;
  sessionId?: string; // 세션 ID
  traceId?: string; // 분산 추적 ID
  action: string; // 예: 'LOGIN', 'LOGOUT', 'PASSWORD_CHANGE' 등
  status: string; // 예: 'SUCCESS', 'FAILURE' 등
  ip?: string;
  userAgent?: string;
  deviceFingerprint?: string; // 브라우저 핑거프린트
  // Cloudflare 지리적 정보 (보안 분석용)
  country?: string; // CF-IPCountry: 비정상적인 위치 감지
  city?: string; // CF-IPCity
  // Cloudflare 보안 정보
  bot?: boolean; // CF-Bot-Management: 봇 공격 감지
  threat?: string | null; // CF-Threat: 위협 점수 (null 가능)
  // 디바이스 정보
  isMobile?: boolean; // 모바일 여부
  // Cloudflare 추적 정보 (디버깅용)
  cfRay?: string; // CF-Ray: 요청 추적 ID
  metadata?: any;
}

/**
 * Activity Log Payload
 *
 * @note category, action은 string으로 유지하여 결합성을 낮춤
 * 각 모듈에서 자체 enum을 정의하고 사용 (예: ActivityType, ActivityCategory)
 * audit-log 모듈은 비즈니스 로직에 의존하지 않는 범용 인프라로 유지
 */
export interface ActivityLogPayload {
  userId?: string;
  sessionId?: string; // 세션 ID
  traceId?: string; // 분산 추적 ID
  category: string; // 예: 'AUTH', 'PAYMENT', 'GAME' 등
  action: string; // 예: 'USER_LOGIN', 'DEPOSIT_REQUEST' 등
  // Cloudflare 지리적 정보 (사용자 활동 추적용)
  country?: string; // CF-IPCountry
  city?: string; // CF-IPCity
  // 디바이스 정보
  isMobile?: boolean; // 모바일 여부
  // Cloudflare 추적 정보 (디버깅용)
  cfRay?: string; // CF-Ray: 요청 추적 ID
  ip?: string; // 클라이언트 IP
  metadata?: any;
}

/**
 * System Error Log Payload
 *
 * @note severity는 로그 레벨이므로 제한된 값으로 정의
 * errorCode는 string으로 유지하여 각 모듈에서 자유롭게 정의 가능
 */
export interface SystemErrorLogPayload {
  userId?: string;
  sessionId?: string; // 세션 ID
  traceId?: string; // 분산 추적 ID
  errorCode?: string; // 모듈별 에러 코드 (예: 'AUTH_INVALID_TOKEN', 'PAYMENT_INSUFFICIENT_BALANCE')
  errorMessage: string;
  stackTrace?: string;
  path?: string;
  method?: string;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  // Cloudflare 지리적 정보 (에러 발생 위치 추적용)
  country?: string; // CF-IPCountry
  city?: string; // CF-IPCity
  // Cloudflare 보안 정보 (공격성 에러 감지용)
  bot?: boolean; // CF-Bot-Management
  threat?: string | null; // CF-Threat (null 가능)
  // 디바이스 정보
  isMobile?: boolean; // 모바일 여부
  // Cloudflare 추적 정보 (디버깅용)
  cfRay?: string; // CF-Ray: 요청 추적 ID
  ip?: string; // 클라이언트 IP
  userAgent?: string; // User-Agent
  metadata?: any;
}

export interface IntegrationLogPayload {
  userId?: string;
  sessionId?: string; // 세션 ID
  traceId?: string; // 분산 추적 ID
  provider: string;
  method: string;
  endpoint: string;
  statusCode?: number;
  duration: number;
  success: boolean;
  // Cloudflare 지리적 정보 (외부 서비스 연동 추적용)
  country?: string; // CF-IPCountry
  city?: string; // CF-IPCity
  // Cloudflare 보안 정보 (공격성 요청 감지용)
  bot?: boolean; // CF-Bot-Management
  threat?: string | null; // CF-Threat (null 가능)
  // Cloudflare 추적 정보 (디버깅용)
  cfRay?: string; // CF-Ray: 요청 추적 ID
  ip?: string; // 클라이언트 IP
  request?: any; // 요청 데이터 (상세 로깅용)
  response?: any; // 응답 데이터 (상세 로깅용)
  metadata?: any; // 추가 메타데이터
}

export type LogJobData =
  | { type: LogType.AUTH; data: AuthLogPayload }
  | { type: LogType.ACTIVITY; data: ActivityLogPayload }
  | { type: LogType.ERROR; data: SystemErrorLogPayload }
  | { type: LogType.INTEGRATION; data: IntegrationLogPayload };

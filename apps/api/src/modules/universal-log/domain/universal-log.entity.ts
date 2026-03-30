import { ActorType, HttpMethod, LogLevel } from '@prisma/client';
import { LogService, LogEvent, PayloadFor, LogActionKey } from './types';

/**
 * [UniversalLog] 범용 통합 로그 엔티티 (Strict Generic)
 * @template K - 'SERVICE.EVENT' 형태의 정의된 액션 키
 */
export class UniversalLog<K extends LogActionKey = LogActionKey> {
  private constructor(
    private readonly _id: bigint,
    private readonly _userId: bigint | null,
    private readonly _actorType: ActorType,
    private readonly _actorId: bigint | null,
    private readonly _action: {
      service: LogService;
      event: LogEvent;
    },
    private readonly _targetId: bigint | null,
    private readonly _traceId: string | null,
    private readonly _sessionId: string | null,
    private readonly _deviceId: string | null,
    private readonly _level: LogLevel,
    private readonly _isSuccess: boolean,
    private readonly _errorCode: string | null,
    private readonly _durationMs: number | null,
    private readonly _payload: PayloadFor<K>,
    private readonly _ipAddress: string | null,
    private readonly _userAgentId: bigint | null,
    private readonly _countryCode: string | null,
    private readonly _requestPath: string | null,
    private readonly _requestMethod: HttpMethod | null,
    private readonly _createdAt: Date,
  ) { }

  /**
   * DB 데이터를 엔티티 객체로 복원
   */
  static rehydrate<NK extends LogActionKey = LogActionKey>(data: {
    id: bigint;
    userId: bigint | null;
    actorType: ActorType;
    actorId: bigint | null;
    service: LogService;
    event: LogEvent;
    targetId: bigint | null;
    traceId: string | null;
    sessionId: string | null;
    deviceId: string | null;
    level: LogLevel;
    isSuccess: boolean;
    errorCode: string | null;
    durationMs: number | null;
    payload: any;
    ipAddress: string | null;
    userAgentId: bigint | null;
    countryCode: string | null;
    requestPath: string | null;
    requestMethod: HttpMethod | null;
    createdAt: Date;
  }): UniversalLog<NK> {
    return new UniversalLog(
      data.id,
      data.userId,
      data.actorType,
      data.actorId,
      { service: data.service, event: data.event },
      data.targetId,
      data.traceId,
      data.sessionId,
      data.deviceId,
      data.level,
      data.isSuccess,
      data.errorCode,
      data.durationMs,
      data.payload as PayloadFor<NK>,
      data.ipAddress,
      data.userAgentId,
      data.countryCode,
      data.requestPath,
      data.requestMethod,
      data.createdAt,
    );
  }

  /**
   * 새로운 로그 인스턴스 생성
   */
  static create<NK extends LogActionKey = LogActionKey>(params: {
    id: bigint;
    service: LogService;
    event: LogEvent;
    createdAt: Date;
    payload: PayloadFor<NK>;
    userId?: bigint | null;
    actorType?: ActorType;
    actorId?: bigint | null;
    targetId?: bigint | null;
    traceId?: string | null;
    sessionId?: string | null;
    deviceId?: string | null;
    level?: LogLevel;
    isSuccess?: boolean;
    errorCode?: string | null;
    durationMs?: number | null;
    ipAddress?: string | null;
    userAgentId?: bigint | null;
    countryCode?: string | null;
    requestPath?: string | null;
    requestMethod?: HttpMethod | null;
  }): UniversalLog<NK> {
    return new UniversalLog(
      params.id,
      params.userId ?? null,
      params.actorType ?? ActorType.USER,
      params.actorId ?? null,
      { service: params.service, event: params.event },
      params.targetId ?? null,
      params.traceId ?? null,
      params.sessionId ?? null,
      params.deviceId ?? null,
      params.level ?? LogLevel.INFO,
      params.isSuccess ?? true,
      params.errorCode ?? null,
      params.durationMs ?? null,
      params.payload,
      params.ipAddress ?? null,
      params.userAgentId ?? null,
      params.countryCode ?? null,
      params.requestPath ?? null,
      params.requestMethod ?? null,
      params.createdAt,
    );
  }

  // --- Getters ---
  get id(): bigint { return this._id; }
  get userId(): bigint | null { return this._userId; }
  get actorType(): ActorType { return this._actorType; }
  get actorId(): bigint | null { return this._actorId; }
  get service(): LogService { return this._action.service; }
  get event(): LogEvent { return this._action.event; }
  
  /**
   * 서비스.이벤트 형태의 전체 액션 문자열 반환 (K 타입 보장)
   */
  get fullAction(): K {
    return `${this._action.service}.${this._action.event}` as K;
  }

  get targetId(): bigint | null { return this._targetId; }
  get traceId(): string | null { return this._traceId; }
  get sessionId(): string | null { return this._sessionId; }
  get deviceId(): string | null { return this._deviceId; }
  get level(): LogLevel { return this._level; }
  get isSuccess(): boolean { return this._isSuccess; }
  get errorCode(): string | null { return this._errorCode; }
  get durationMs(): number | null { return this._durationMs; }
  get payload(): PayloadFor<K> { return this._payload; }
  get ipAddress(): string | null { return this._ipAddress; }
  get userAgentId(): bigint | null { return this._userAgentId; }
  get countryCode(): string | null { return this._countryCode; }
  get requestPath(): string | null { return this._requestPath; }
  get requestMethod(): HttpMethod | null { return this._requestMethod; }
  get createdAt(): Date { return this._createdAt; }
}

import { Inject, Injectable } from '@nestjs/common';
import { ActorType, HttpMethod, LogLevel } from '@prisma/client';
import { SnowflakeService } from '../../../common/snowflake/snowflake.service';
import { LogActionKey, LogEvent, LogService, PayloadFor } from '../domain/types';
import { UniversalLog } from '../domain/universal-log.entity';
import { UserAgentCatalog } from '../domain/user-agent-catalog.entity';
import { UNIVERSAL_LOG_REPOSITORY_PORT, UniversalLogRepositoryPort } from '../ports/universal-log.repository.port';
import { USER_AGENT_CATALOG_REPOSITORY_PORT, UserAgentCatalogRepositoryPort } from '../ports/user-agent-catalog.repository.port';

/**
 * 로그 생성 명령 인터페이스
 */
export interface CreateLogCommand<K extends LogActionKey> {
  /** 'service.event' 형태의 액션 키 */
  action: K;
  /** 행위 주체 유저 ID */
  userId?: bigint | null;
  /** 행위자 타입 (기본 USER) */
  actorType?: ActorType;
  /** 행위자 고유 ID (관리자 ID 등) */
  actorId?: bigint | null;
  /** 조작 대상 객체 ID */
  targetId?: bigint | null;
  /** 분산 추적 ID */
  traceId?: string | null;
  /** 세션 ID */
  sessionId?: string | null;
  /** 기기 고유 ID */
  deviceId?: string | null;
  /** 로그 레벨 (기본 INFO) */
  level?: LogLevel;
  /** 성공 여부 (기본 true) */
  isSuccess?: boolean;
  /** 실패 시 에러 코드 */
  errorCode?: string | null;
  /** 소요 시간 (ms) */
  durationMs?: number | null;
  /** 도메인별 가변 상세 페이로드 */
  payload: PayloadFor<K>;
  /** 클라이언트 IP 주소 */
  ipAddress?: string | null;
  /** 원본 User-Agent 문자열 */
  userAgent?: string | null;
  /** 국가 코드 (ISO 3166-1 alpha-2) */
  countryCode?: string | null;
  /** 요청 경로 */
  requestPath?: string | null;
  /** HTTP 메서드 */
  requestMethod?: HttpMethod | null;
  /** 생성 시각 (기본 현재 시각) */
  createdAt?: Date;
}

/**
 * [UniversalLog] 로그 생성 애플리케이션 서비스
 * 도메인 엔티티 생성, ID 채번(Snowflake), UA 정규화 및 영속화를 담당합니다.
 */
@Injectable()
export class CreateUniversalLogService {
  constructor(
    @Inject(UNIVERSAL_LOG_REPOSITORY_PORT)
    private readonly logRepository: UniversalLogRepositoryPort,
    @Inject(USER_AGENT_CATALOG_REPOSITORY_PORT)
    private readonly userAgentRepository: UserAgentCatalogRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * 로그를 생성하고 저장합니다.
   */
  async execute<K extends LogActionKey>(command: CreateLogCommand<K>): Promise<void> {
    // 1. Action Key 분리 (service.event)
    const [service, event] = command.action.split('.') as [LogService, LogEvent];

    // 2. User Agent ID 확보 (있을 경우만)
    let userAgentId: bigint | null = null;
    if (command.userAgent) {
      const uaCatalog = UserAgentCatalog.fromRaw(command.userAgent);
      userAgentId = await this.userAgentRepository.upsert(uaCatalog);
    }

    // 3. ID 및 생성 시각 생성 (Snowflake)
    const { id, timestamp } = this.snowflakeService.generate(command.createdAt);

    // 4. 도메인 엔티티 생성
    const log = UniversalLog.create<K>({
      id,
      service,
      event,
      createdAt: command.createdAt ?? timestamp,
      payload: command.payload,
      userId: command.userId,
      actorType: command.actorType,
      actorId: command.actorId,
      targetId: command.targetId,
      traceId: command.traceId,
      sessionId: command.sessionId,
      deviceId: command.deviceId,
      level: command.level,
      isSuccess: command.isSuccess,
      errorCode: command.errorCode,
      durationMs: command.durationMs,
      ipAddress: command.ipAddress,
      userAgentId,
      countryCode: command.countryCode,
      requestPath: command.requestPath,
      requestMethod: command.requestMethod,
    });

    // 5. 저장 도구 호출
    await this.logRepository.save(log);
  }
}

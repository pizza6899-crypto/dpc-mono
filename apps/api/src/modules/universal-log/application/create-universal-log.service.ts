import { Inject, Injectable } from '@nestjs/common';
import { ActorType, HttpMethod, LogLevel } from '@prisma/client';
import { SnowflakeService } from '../../../common/snowflake/snowflake.service';
import { LogActionKey, LogEvent, LogService, PayloadFor } from '../domain/types';
import { UserAgentCatalog } from '../domain/user-agent-catalog.entity';
import { USER_AGENT_CATALOG_REPOSITORY_PORT, UserAgentCatalogRepositoryPort } from '../ports/user-agent-catalog.repository.port';
import { UNIVERSAL_LOG_KEYS } from '../infrastructure/universal-log.bullmq';
import { RedisService } from 'src/infrastructure/redis/redis.service';

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
 * Redis List를 버퍼로 사용하여 초고성능 로깅을 처리합니다.
 */
@Injectable()
export class CreateUniversalLogService {
  constructor(
    private readonly redis: RedisService,
    @Inject(USER_AGENT_CATALOG_REPOSITORY_PORT)
    private readonly userAgentRepository: UserAgentCatalogRepositoryPort,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * 로그 생성 실행 (버퍼 적재)
   */
  async execute<K extends LogActionKey>(command: CreateLogCommand<K>): Promise<void> {
    const { action, userAgent } = command;

    // 1. 서비스/이벤트 분리 (ActionKey: 'SERVICE.EVENT')
    const [service, event] = action.split('.') as [LogService, LogEvent];

    // 2. UserAgent ID 확인/생성 (고중복 데이터 최적화)
    let userAgentId: bigint | null = null;
    if (userAgent) {
      const uaEntity = UserAgentCatalog.fromRaw(userAgent);
      userAgentId = await this.userAgentRepository.upsert(uaEntity);
    }

    // 3. Snowflake ID 채번 (정적 시간 제어 포함)
    const { id, timestamp } = this.snowflakeService.generate(command.createdAt);

    // 4. Redis List 버퍼 적재 (RPUSH)
    await this.redis.rpush(UNIVERSAL_LOG_KEYS.BUFFER, {
      id: id.toString(), // BigInt -> string
      service,
      event,
      createdAt: (command.createdAt ?? timestamp).toISOString(),
      payload: command.payload,
      userId: command.userId?.toString(),
      actorType: command.actorType,
      actorId: command.actorId?.toString(),
      targetId: command.targetId?.toString(),
      traceId: command.traceId,
      sessionId: command.sessionId,
      deviceId: command.deviceId,
      level: command.level,
      isSuccess: command.isSuccess,
      errorCode: command.errorCode,
      durationMs: command.durationMs,
      ipAddress: command.ipAddress,
      userAgentId: userAgentId?.toString(),
      countryCode: command.countryCode,
      requestPath: command.requestPath,
      requestMethod: command.requestMethod,
    });
  }
}

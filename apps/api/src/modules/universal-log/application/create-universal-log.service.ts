import { Inject, Injectable } from '@nestjs/common';
import { ActorType, LogLevel, UserRoleType } from '@prisma/client';
import { SnowflakeService } from '../../../infrastructure/snowflake/snowflake.service';
import { LogActionKey, LogEvent, LogService, PayloadFor } from '../domain/types';
import { UserAgentCatalog } from '../domain/user-agent-catalog.entity';
import { USER_AGENT_CATALOG_REPOSITORY_PORT, UserAgentCatalogRepositoryPort } from '../ports/user-agent-catalog.repository.port';
import { UNIVERSAL_LOG_KEYS } from '../infrastructure/universal-log.bullmq';
import { RedisService } from 'src/infrastructure/redis/redis.service';
import { RequestContextService } from 'src/infrastructure/cls/request-context.service';

/**
 * 로그 생성 명령 인터페이스
 */
export interface CreateLogCommand<K extends LogActionKey> {
  /** 'service.event' 형태의 액션 키 */
  action: K;
  /** 도메인별 가변 상세 페이로드 */
  payload: PayloadFor<K>;
  /** 로그 레벨 (기본 INFO) */
  level?: LogLevel;
  /** 성공 여부 (기본 true) */
  isSuccess?: boolean;
  /** 조작 대상 객체 ID (없으면 null) */
  targetId: bigint | null;
  /** 행위자 고유 ID (관리자 ID 등, 시스템 처리면 null) */
  actorId: bigint | null;
  /** 행위자 타입 (명시적으로 지정할 경우만) */
  actorType?: ActorType;
  /** 실패 시 에러 코드 */
  errorCode?: string;
  /** 소요 시간 (ms) */
  durationMs?: number;
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
    private readonly context: RequestContextService, // 컨텍스트 서비스 주입
  ) { }

  /**
   * 로그 생성 실행 (버퍼 적재)
   */
  async execute<K extends LogActionKey>(command: CreateLogCommand<K>): Promise<void> {
    const { action } = command;

    // 1. 서비스/이벤트 분리 (ActionKey: 'SERVICE.EVENT')
    const [service, event] = action.split('.') as [LogService, LogEvent];

    // 2. UserAgent ID 확인/생성 (고중복 데이터 최적화)
    let userAgentId: bigint | null = null;
    const finalUserAgent = this.context.getClientInfo()?.userAgent;

    if (finalUserAgent) {
      const uaEntity = UserAgentCatalog.fromRaw(finalUserAgent);
      userAgentId = await this.userAgentRepository.upsert(uaEntity);
    }

    // 3. Request Context로부터 필수 정보 자동 추출
    const contextUser = this.context.getUser();
    const resolvedUserId = contextUser?.id;

    // 행위자 타입 자동 결정 로직
    let resolvedActorType = command.actorType;
    if (!resolvedActorType) {
      if (!contextUser) {
        resolvedActorType = ActorType.SYSTEM;
      } else {
        resolvedActorType = contextUser.role === UserRoleType.SUPER_ADMIN
          ? ActorType.ADMIN
          : ActorType.USER;
      }
    }

    // 4. Snowflake ID 채번 (현재 시점 기준)
    const { id, timestamp } = this.snowflakeService.generate();

    // 5. Redis List 버퍼 적재 (RPUSH)
    await this.redis.rpush(UNIVERSAL_LOG_KEYS.BUFFER, {
      id: id.toString(),
      service,
      event,
      createdAt: timestamp.toISOString(),
      payload: command.payload,
      userId: resolvedUserId?.toString(),
      actorType: resolvedActorType,
      actorId: command.actorId?.toString(),
      targetId: command.targetId?.toString(),
      traceId: this.context.getTraceId(),
      sessionId: this.context.getSessionId(),
      deviceId: this.context.getDeviceId(),
      level: command.level,
      isSuccess: command.isSuccess,
      errorCode: command.errorCode,
      durationMs: command.durationMs,
      ipAddress: this.context.getIpAddress(),
      userAgentId: userAgentId?.toString(),
      countryCode: this.context.getCountryCode(),
      requestPath: this.context.getClientInfo()?.path,
      requestMethod: this.context.getClientInfo()?.method,
    });
  }
}

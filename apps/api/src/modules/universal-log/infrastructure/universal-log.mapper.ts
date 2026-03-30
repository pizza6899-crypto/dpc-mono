import { UniversalLog as PrismaLog } from '@prisma/client';
import { UniversalLog } from '../domain/universal-log.entity';
import { LogActionKey, LogService, LogEvent } from '../domain/types';

/**
 * [UniversalLog] 도메인 엔티티와 Prisma 데이터 간의 변환기
 */
export class UniversalLogMapper {
  /**
   * Prisma의 저수준 데이터를 도메인 엔티티로 복원 (rehydrate)
   */
  static toDomain<K extends LogActionKey = LogActionKey>(prismaLog: PrismaLog): UniversalLog<K> {
    return UniversalLog.rehydrate<K>({
      id: prismaLog.id,
      userId: prismaLog.userId,
      actorType: prismaLog.actorType,
      actorId: prismaLog.actorId,
      service: prismaLog.service as LogService,
      event: prismaLog.event as LogEvent,
      targetId: prismaLog.targetId,
      traceId: prismaLog.traceId,
      sessionId: prismaLog.sessionId,
      deviceId: prismaLog.deviceId,
      level: prismaLog.level,
      isSuccess: prismaLog.isSuccess,
      errorCode: prismaLog.errorCode,
      durationMs: prismaLog.durationMs,
      payload: prismaLog.payload,
      ipAddress: prismaLog.ipAddress,
      userAgentId: prismaLog.userAgentId,
      countryCode: prismaLog.countryCode,
      requestPath: prismaLog.requestPath,
      requestMethod: prismaLog.requestMethod,
      createdAt: prismaLog.createdAt,
    });
  }

  /**
   * 도메인 엔티티를 Prisma의 저수준 데이터로 변환
   */
  static toPersistence<K extends LogActionKey>(domainLog: UniversalLog<K>): PrismaLog {
    return {
      id: domainLog.id,
      userId: domainLog.userId,
      actorType: domainLog.actorType,
      actorId: domainLog.actorId,
      service: domainLog.service,
      event: domainLog.event,
      targetId: domainLog.targetId,
      traceId: domainLog.traceId,
      sessionId: domainLog.sessionId,
      deviceId: domainLog.deviceId,
      level: domainLog.level,
      isSuccess: domainLog.isSuccess,
      errorCode: domainLog.errorCode,
      durationMs: domainLog.durationMs,
      payload: domainLog.payload as any, // JsonValue 인덱스 시그니처 호환용
      ipAddress: domainLog.ipAddress,
      userAgentId: domainLog.userAgentId,
      countryCode: domainLog.countryCode,
      requestPath: domainLog.requestPath,
      requestMethod: domainLog.requestMethod,
      createdAt: domainLog.createdAt,
    };
  }
}

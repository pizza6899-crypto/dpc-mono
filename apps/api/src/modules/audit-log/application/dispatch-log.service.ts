import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { LogJobData } from '../domain';
import { LogType } from '../domain';
import { BULLMQ_QUEUES } from 'src/infrastructure/bullmq/bullmq.constants';
import { SnowflakeService } from 'src/common/snowflake/snowflake.service';
import type { RequestClientInfo } from 'src/common/http/types/client-info.types';
import { sanitizeAndTruncate } from 'src/utils/log-sanitizer.util';

interface LogQueueJobData {
  id: string;
  createdAt: string; // Snowflake ID에서 추출한 타임스탬프 (ISO 8601)
  payload: LogJobData;
}

/**
 * Dispatch Log Service
 * 외부 모듈에서 큐잉하기 위한 관문
 * 공통 payload를 받아 타입에 따라 분기처리하여 큐잉 처리
 */
@Injectable()
export class DispatchLogService {
  private readonly logger = new Logger(DispatchLogService.name);

  constructor(
    @InjectQueue(BULLMQ_QUEUES.AUDIT.CRITICAL.name)
    private readonly criticalLogQueue: Queue<LogQueueJobData>,
    @InjectQueue(BULLMQ_QUEUES.AUDIT.HEAVY.name)
    private readonly heavyLogQueue: Queue<LogQueueJobData>,
    private readonly snowflakeService: SnowflakeService,
  ) { }

  /**
   * Cloudflare 정보를 로그 타입에 맞게 매핑
   */
  private enrichPayloadWithClientInfo<T extends LogJobData>(
    payload: T,
    clientInfo: RequestClientInfo,
  ): T {
    if (payload.type === LogType.AUTH) {
      return {
        ...payload,
        data: {
          ...payload.data,
          sessionId: clientInfo.sessionId || payload.data.sessionId,
          traceId: clientInfo.traceId,
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
          deviceFingerprint: clientInfo.fingerprint,
          country: clientInfo.country,
          city: clientInfo.city,
          bot: clientInfo.bot,
          threat: clientInfo.threat,
          isMobile: clientInfo.isMobile,
          cfRay: clientInfo.cfRay,
        },
      } as T;
    }

    if (payload.type === LogType.ACTIVITY) {
      return {
        ...payload,
        data: {
          ...payload.data,
          sessionId: clientInfo.sessionId || payload.data.sessionId,
          traceId: clientInfo.traceId,
          country: clientInfo.country,
          city: clientInfo.city,
          isMobile: clientInfo.isMobile,
          cfRay: clientInfo.cfRay,
          ip: clientInfo.ip,
        },
      } as T;
    }

    if (payload.type === LogType.ERROR) {
      return {
        ...payload,
        data: {
          ...payload.data,
          sessionId: clientInfo.sessionId || payload.data.sessionId,
          traceId: clientInfo.traceId,
          country: clientInfo.country,
          city: clientInfo.city,
          bot: clientInfo.bot,
          threat: clientInfo.threat,
          isMobile: clientInfo.isMobile,
          cfRay: clientInfo.cfRay,
          ip: clientInfo.ip,
          userAgent: clientInfo.userAgent,
        },
      } as T;
    }

    if (payload.type === LogType.INTEGRATION) {
      return {
        ...payload,
        data: {
          ...payload.data,
          sessionId: clientInfo.sessionId || payload.data.sessionId,
          traceId: clientInfo.traceId,
          country: clientInfo.country,
          city: clientInfo.city,
          bot: clientInfo.bot,
          threat: clientInfo.threat,
          cfRay: clientInfo.cfRay,
          ip: clientInfo.ip,
        },
      } as T;
    }

    return payload;
  }

  /**
   * 로그 데이터 정제 (길이 제한 및 민감 정보 마스킹)
   */
  private sanitizePayload<T extends LogJobData>(payload: T): T {
    if (payload.type === LogType.INTEGRATION) {
      return {
        ...payload,
        data: {
          ...payload.data,
          request: sanitizeAndTruncate(payload.data.request),
          response: sanitizeAndTruncate(payload.data.response),
          metadata: sanitizeAndTruncate(payload.data.metadata),
        },
      } as T;
    }

    // 다른 로그 타입도 필요시 추가 처리 (예: Error stack trace 길이 제한 등)
    if (payload.type === LogType.ERROR) {
      return {
        ...payload,
        data: {
          ...payload.data,
          stackTrace: sanitizeAndTruncate(payload.data.stackTrace, 2048), // 스택 트레이스도 너무 길면 자름
        },
      } as T;
    }

    return payload;
  }

  /**
   * 로그를 큐에 디스패치
   *
   * @param payload 로그 데이터 (타입에 따라 분기 처리)
   * @param clientInfo RequestClientInfo (옵셔널, 제공 시 Cloudflare 정보 자동 매핑)
   *
   * @example
   * ```typescript
   * // Cloudflare 정보 없이 사용
   * await dispatchLogService.dispatch({
   *   type: LogType.AUTH,
   *   data: { userId: '123', action: 'LOGIN', status: 'SUCCESS' },
   * });
   *
   * // Cloudflare 정보와 함께 사용 (자동 매핑)
   * await dispatchLogService.dispatch(
   *   {
   *     type: LogType.AUTH,
   *     data: { userId: '123', action: 'LOGIN', status: 'SUCCESS' },
   *   },
   *   requestInfo
   * );
   * ```
   */
  async dispatch(
    payload: LogJobData,
    clientInfo?: RequestClientInfo,
  ): Promise<void> {
    try {
      // clientInfo가 제공되면 Cloudflare 정보를 자동으로 매핑
      const enrichedPayload = clientInfo
        ? this.enrichPayloadWithClientInfo(payload, clientInfo)
        : payload;

      // 데이터 정제 및 길이 제한 (특히 Integration 로그의 요청/응답 바디)
      let sanitizedPayload = this.sanitizePayload(enrichedPayload);

      // 순환 참조 제거 (JSON.stringify 에러 방지)
      sanitizedPayload = this.removeCircularReferences(sanitizedPayload);

      // 타임스탬프 기반 Snowflake ID 생성 (ID와 시간의 일관성 보장)
      const { id, timestamp: createdAt } = this.snowflakeService.generate();

      const jobData: LogQueueJobData = {
        id: id.toString(),
        createdAt: createdAt.toISOString(),
        payload: sanitizedPayload,
      };

      // 로그 타입에 따라 적절한 큐에 추가
      if (
        sanitizedPayload.type === LogType.AUTH ||
        sanitizedPayload.type === LogType.INTEGRATION
      ) {
        await this.criticalLogQueue.add(
          BULLMQ_QUEUES.AUDIT.CRITICAL.name,
          jobData,
          {
            jobId: `log_${id.toString()}`,
          },
        );
      } else {
        // ACTIVITY, ERROR
        await this.heavyLogQueue.add(BULLMQ_QUEUES.AUDIT.HEAVY.name, jobData, {
          jobId: `log_${id.toString()}`,
        });
      }
    } catch (error) {
      this.logger.error(
        `로그 디스패치 실패 - type: ${payload.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      // 로깅 실패는 시스템에 영향을 주지 않도록 에러를 throw하지 않음
    }
  }

  /**
   * 객체 내의 순환 참조를 제거하여 JSON 직렬화 가능하게 만듭니다.
   */
  private removeCircularReferences<T>(obj: T): T {
    const seen = new WeakSet();
    const detect = (value: any): any => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
        const newObj: any = Array.isArray(value) ? [] : {};
        for (const key in value) {
          newObj[key] = detect(value[key]);
        }
        return newObj;
      }
      return value;
    };
    return detect(obj);
  }
}

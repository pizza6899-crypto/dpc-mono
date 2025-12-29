import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type {
  LogJobData,
  AuthLogPayload,
  ActivityLogPayload,
  SystemErrorLogPayload,
  IntegrationLogPayload,
} from '../domain';
import { LogType } from '../domain';
import {
  CRITICAL_LOG_QUEUE_NAME,
  HEAVY_LOG_QUEUE_NAME,
} from '../infrastructure/queue.constants';
import { generateUid } from 'src/utils/id.util';
import type { RequestClientInfo } from 'src/platform/http/types/client-info.types';

interface LogQueueJobData {
  id: string;
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
    @InjectQueue(CRITICAL_LOG_QUEUE_NAME)
    private readonly criticalLogQueue: Queue<LogQueueJobData>,
    @InjectQueue(HEAVY_LOG_QUEUE_NAME)
    private readonly heavyLogQueue: Queue<LogQueueJobData>,
  ) {}

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
          country: clientInfo.country,
          city: clientInfo.city,
          isMobile: clientInfo.isMobile,
          cfRay: clientInfo.cfRay,
        },
      } as T;
    }

    if (payload.type === LogType.ERROR) {
      return {
        ...payload,
        data: {
          ...payload.data,
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

      const id = generateUid();
      const jobData: LogQueueJobData = { id, payload: enrichedPayload };

      // 로그 타입에 따라 적절한 큐에 추가
      if (
        enrichedPayload.type === LogType.AUTH ||
        enrichedPayload.type === LogType.INTEGRATION
      ) {
        await this.criticalLogQueue.add(
          `${enrichedPayload.type.toLowerCase()}-log`,
          jobData,
          {
            jobId: id,
            removeOnComplete: true,
            attempts: 10,
            backoff: { type: 'exponential', delay: 1000 },
          }
        );
      } else {
        // ACTIVITY, ERROR
        await this.heavyLogQueue.add(
          `${enrichedPayload.type.toLowerCase()}-log`,
          jobData,
          {
            jobId: id,
            removeOnComplete: true,
            attempts: 3,
            backoff: { type: 'exponential', delay: 1000 },
          }
        );
      }
    } catch (error) {
      this.logger.error(
        `로그 디스패치 실패 - type: ${payload.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      // 로깅 실패는 시스템에 영향을 주지 않도록 에러를 throw하지 않음
    }
  }

}


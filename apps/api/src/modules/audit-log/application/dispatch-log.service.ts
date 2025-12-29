import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { LogJobData } from '../domain';
import { LogType } from '../domain';
import {
  CRITICAL_LOG_QUEUE_NAME,
  HEAVY_LOG_QUEUE_NAME,
} from '../infrastructure/queue.constants';
import { IdUtil } from 'src/utils/id.util';

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
   * 로그를 큐에 디스패치
   * @param payload 로그 데이터 (타입에 따라 분기 처리)
   */
  async dispatch(payload: LogJobData): Promise<void> {
    try {
      const id = IdUtil.generateUid();
      const jobData: LogQueueJobData = { id, payload };

      // 로그 타입에 따라 적절한 큐에 추가
      if (
        payload.type === LogType.AUTH ||
        payload.type === LogType.INTEGRATION
      ) {
        await this.criticalLogQueue.add(
          `${payload.type.toLowerCase()}-log`,
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
          `${payload.type.toLowerCase()}-log`,
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


import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, OnApplicationShutdown, Inject } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '../ports/out';
import type { AuditLogRepositoryPort } from '../ports/out';
import type { LogJobData } from '../domain';
import { LogType } from '../domain';
import {
  CRITICAL_LOG_QUEUE_NAME,
  HEAVY_LOG_QUEUE_NAME,
} from './queue.constants';

interface LogQueueJobData {
  id: string;
  createdAt: string; // Snowflake ID에서 추출한 타임스탬프 (ISO 8601)
  payload: LogJobData;
}

/**
 * Critical Log Processor
 * AUTH, INTEGRATION 로그를 처리
 */
@Processor(CRITICAL_LOG_QUEUE_NAME)
export class CriticalLogProcessor
  extends WorkerHost
  implements OnApplicationShutdown {
  private readonly logger = new Logger(CriticalLogProcessor.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {
    super();
  }

  async process(job: Job<LogQueueJobData>): Promise<void> {
    const { id, createdAt, payload } = job.data;
    const snowflakeId = BigInt(id);
    const timestamp = new Date(createdAt);

    try {
      if (payload.type === LogType.AUTH) {
        await this.auditLogRepository.saveAuthLog(snowflakeId, timestamp, payload.data);
      } else if (payload.type === LogType.INTEGRATION) {
        await this.auditLogRepository.saveIntegrationLog(snowflakeId, timestamp, payload.data);
      } else {
        this.logger.warn(
          `Unexpected log type in critical queue: ${payload.type}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Critical log 저장 실패 - jobId: ${job.id}, type: ${payload.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error; // BullMQ가 재시도하도록 에러 throw
    }
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    try {
      // Worker가 초기화되지 않았을 수 있으므로 try-catch로 안전하게 처리
      const worker = this.worker;
      if (worker) {
        await worker.close();
        this.logger.log('워커가 안전하게 종료되었습니다.');
      }
    } catch (error) {
      // Worker가 초기화되지 않은 경우 에러를 무시 (테스트 환경 등)
      if (
        error instanceof Error &&
        error.message.includes('has not yet been initialized')
      ) {
        return;
      }
      this.logger.error(
        'CriticalLogProcessor 종료 중 오류 발생',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

/**
 * Heavy Log Processor
 * ACTIVITY, ERROR 로그를 처리
 */
@Processor(HEAVY_LOG_QUEUE_NAME)
export class HeavyLogProcessor
  extends WorkerHost
  implements OnApplicationShutdown {
  private readonly logger = new Logger(HeavyLogProcessor.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {
    super();
  }

  async process(job: Job<LogQueueJobData>): Promise<void> {
    const { id, createdAt, payload } = job.data;
    const snowflakeId = BigInt(id);
    const timestamp = new Date(createdAt);

    try {
      if (payload.type === LogType.ACTIVITY) {
        await this.auditLogRepository.saveActivityLog(snowflakeId, timestamp, payload.data);
      } else if (payload.type === LogType.ERROR) {
        await this.auditLogRepository.saveSystemErrorLog(snowflakeId, timestamp, payload.data);
      } else {
        this.logger.warn(`Unexpected log type in heavy queue: ${payload.type}`);
      }
    } catch (error) {
      this.logger.error(
        `Heavy log 저장 실패 - jobId: ${job.id}, type: ${payload.type}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error; // BullMQ가 재시도하도록 에러 throw
    }
  }

  async onApplicationShutdown(signal?: string): Promise<void> {
    try {
      // Worker가 초기화되지 않았을 수 있으므로 try-catch로 안전하게 처리
      const worker = this.worker;
      if (worker) {
        await worker.close();
        this.logger.log('워커가 안전하게 종료되었습니다.');
      }
    } catch (error) {
      // Worker가 초기화되지 않은 경우 에러를 무시 (테스트 환경 등)
      if (
        error instanceof Error &&
        error.message.includes('has not yet been initialized')
      ) {
        return;
      }
      this.logger.error(
        'HeavyLogProcessor 종료 중 오류 발생',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}


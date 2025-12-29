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
  payload: LogJobData;
}

/**
 * Critical Log Processor
 * AUTH, INTEGRATION 로그를 처리
 */
@Processor(CRITICAL_LOG_QUEUE_NAME)
export class CriticalLogProcessor
  extends WorkerHost
  implements OnApplicationShutdown
{
  private readonly logger = new Logger(CriticalLogProcessor.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {
    super();
  }

  async process(job: Job<LogQueueJobData>): Promise<void> {
    const { id, payload } = job.data;

    try {
      if (payload.type === LogType.AUTH) {
        await this.auditLogRepository.saveAuthLog(id, payload.data);
      } else if (payload.type === LogType.INTEGRATION) {
        await this.auditLogRepository.saveIntegrationLog(id, payload.data);
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
    if (this.worker) {
      await this.worker.close();
      this.logger.log('워커가 안전하게 종료되었습니다.');
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
  implements OnApplicationShutdown
{
  private readonly logger = new Logger(HeavyLogProcessor.name);

  constructor(
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: AuditLogRepositoryPort,
  ) {
    super();
  }

  async process(job: Job<LogQueueJobData>): Promise<void> {
    const { id, payload } = job.data;

    try {
      if (payload.type === LogType.ACTIVITY) {
        await this.auditLogRepository.saveActivityLog(id, payload.data);
      } else if (payload.type === LogType.ERROR) {
        await this.auditLogRepository.saveSystemErrorLog(id, payload.data);
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
    if (this.worker) {
      await this.worker.close();
      this.logger.log('워커가 안전하게 종료되었습니다.');
    }
  }
}


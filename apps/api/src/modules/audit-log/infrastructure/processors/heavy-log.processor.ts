import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger, Inject } from '@nestjs/common';
import { AUDIT_LOG_REPOSITORY } from '../../ports/out';
import type { AuditLogRepositoryPort } from '../../ports/out';
import type { LogJobData } from '../../domain';
import { LogType } from '../../domain';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { ClsService } from 'nestjs-cls';

const heavyConfig = getQueueConfig('AUDIT', 'HEAVY');

interface LogQueueJobData {
    id: string;
    createdAt: string; // Snowflake ID에서 추출한 타임스탬프 (ISO 8601)
    payload: LogJobData;
}

/**
 * Heavy Log Processor
 * ACTIVITY, ERROR 로그를 처리
 */
@Processor(heavyConfig.processorOptions, heavyConfig.workerOptions)
export class HeavyLogProcessor extends BaseProcessor<LogQueueJobData, void> {
    protected readonly logger = new Logger(HeavyLogProcessor.name);

    constructor(
        @Inject(AUDIT_LOG_REPOSITORY)
        private readonly auditLogRepository: AuditLogRepositoryPort,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<LogQueueJobData>): Promise<void> {
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
}

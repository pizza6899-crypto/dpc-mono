import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TierAuditJobType, TierAuditJobPayload } from './tier-audit.types';
import { TierAuditService } from '../application/tier-audit.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.TIER.STATS_RECORD);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierStatsRecordProcessor extends BaseProcessor<TierAuditJobPayload, void> {
    protected readonly logger = new Logger(TierStatsRecordProcessor.name);

    constructor(
        private readonly auditService: TierAuditService,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<TierAuditJobPayload>): Promise<void> {
        const { data: payload } = job;

        if (!payload || payload.type !== TierAuditJobType.RECORD_TIER_SNAPSHOT) {
            this.logger.warn(`Unknown or missing tier audit job type: ${payload?.type}`);
            return;
        }

        await this.auditService.handleRecordStats(payload.data);
    }
}

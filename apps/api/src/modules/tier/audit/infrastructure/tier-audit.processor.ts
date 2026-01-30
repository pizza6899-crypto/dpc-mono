import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TierAuditJobType, TierAuditJobPayload } from './tier-audit.constants';
import { TierAuditService } from '../application/tier-audit.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

const queueConfig = getQueueConfig('TIER', 'AUDIT');

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierAuditProcessor extends BaseProcessor<TierAuditJobPayload, void> {
    protected readonly logger = new Logger(TierAuditProcessor.name);

    constructor(
        private readonly auditService: TierAuditService,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<TierAuditJobPayload>): Promise<void> {
        const payload = job.data;

        // 타입 가드 형태로 분기 처리
        switch (payload.type) {
            case TierAuditJobType.RECORD_TIER_SNAPSHOT:
                await this.auditService.handleRecordStats(payload.data);
                break;
            default:
                this.logger.warn(`Unknown tier audit job type: ${(payload as any).type}`);
        }
    }
}

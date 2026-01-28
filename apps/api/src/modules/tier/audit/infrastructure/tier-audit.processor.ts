import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TIER_AUDIT_QUEUE_NAME, TierAuditJobType, TierAuditJobPayload } from './tier-audit.constants';
import { TierAuditService } from '../application/tier-audit.service';

@Processor(TIER_AUDIT_QUEUE_NAME)
export class TierAuditProcessor extends WorkerHost {
    private readonly logger = new Logger(TierAuditProcessor.name);

    constructor(
        private readonly auditService: TierAuditService,
        private readonly cls: ClsService,
    ) {
        super();
    }

    async process(job: Job<TierAuditJobPayload>): Promise<void> {
        await this.cls.run(async () => {
            const payload = job.data;

            try {
                switch (payload.type) {
                    case TierAuditJobType.RECORD_TIER_SNAPSHOT:
                        await this.auditService.handleRecordStats(payload.data);
                        break;
                    case TierAuditJobType.RECORD_USER_MONTHLY_STATS:
                        await this.auditService.handleRecordUserPeriodStats(payload.data);
                        break;
                    case TierAuditJobType.RECORD_DEMOTION_WARNING:
                        await this.auditService.handleRecordDemotionWarning(payload.data);
                        break;
                    default:
                        // @ts-expect-error - exhaustive check
                        this.logger.warn(`Unknown job type: ${payload.type}`);
                }
            } catch (error) {
                this.logger.error(`Failed to process tier audit job [${payload.type}]: ${error.message}`, error.stack);
                throw error;
            }
        });
    }
}

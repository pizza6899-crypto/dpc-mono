import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TierAuditJobType, TierAuditJobPayload } from './tier-audit.types';
import { TierAuditService } from '../application/tier-audit.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';

import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.TIER.AUDIT);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierAuditProcessor extends BaseProcessor<TierAuditJobPayload, void> {
    protected readonly logger = new Logger(TierAuditProcessor.name);

    constructor(
        private readonly auditService: TierAuditService,
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<TierAuditJobPayload>): Promise<void> {
        const { data: payload } = job;

        // 1. 페이로드가 없거나 type이 없으면 반복 작업(Cron)으로 간주
        if (!payload || !payload.type) {
            await this.handleHourlySnapshot();
            return;
        }

        // 2. 일반 큐 잡 처리 (payload.type 기준)
        switch (payload.type) {
            case TierAuditJobType.RECORD_TIER_SNAPSHOT:
                await this.auditService.handleRecordStats(payload.data);
                break;
            default:
                this.logger.warn(`Unknown tier audit job type: ${(payload as any).type}`);
        }
    }

    private async handleHourlySnapshot() {
        this.logger.log('Starting hourly tier stats snapshot...');
        const now = new Date();
        const counts = await this.userTierRepository.countGroupByTierId();
        const allTiers = await this.tierRepository.findAll();

        const countMap = new Map<string, number>();
        counts.forEach(c => countMap.set(c.tierId.toString(), c.count));

        for (const tier of allTiers) {
            const userCount = countMap.get(tierIdStr(tier.id));
            await this.auditService.recordTierStats(now, tier.id, {
                snapshotUserCount: userCount
            });
        }
        this.logger.log(`Hourly tier stats snapshot completed. Processed ${allTiers.length} tiers.`);
    }
}

function tierIdStr(id: string | bigint): string {
    return id.toString();
}

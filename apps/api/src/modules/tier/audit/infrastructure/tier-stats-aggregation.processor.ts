import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { TierAuditService } from '../application/tier-audit.service';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { TierRepositoryPort } from '../../master/infrastructure/tier.repository.port';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.TIER.STATS_AGGREGATION);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierStatsAggregationProcessor extends BaseProcessor<any, void> {
    protected readonly logger = new Logger(TierStatsAggregationProcessor.name);

    constructor(
        private readonly auditService: TierAuditService,
        private readonly userTierRepository: UserTierRepositoryPort,
        private readonly tierRepository: TierRepositoryPort,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<any>): Promise<void> {
        this.logger.log('Starting hourly tier stats snapshot aggregation...');

        try {
            const now = new Date();
            // 현재 모든 티어의 기준 정보 조회
            const allTiers = await this.tierRepository.findAll();

            // 각 티어 및 상태별 현재 사용자 수 집계 (GROUP BY tierId, status)
            const stats = await this.userTierRepository.countGroupByTierAndStatus();

            // 데이터 분석을 위한 맵 구성
            const tierMap = new Map<string, { total: number; maintained: number; grace: number }>();

            stats.forEach(s => {
                const tid = s.tierId.toString();
                const current = tierMap.get(tid) || { total: 0, maintained: 0, grace: 0 };

                current.total += s.count;
                if (s.status === 'ACTIVE') current.maintained += s.count;
                if (s.status === 'GRACE') current.grace += s.count;

                tierMap.set(tid, current);
            });

            let processedCount = 0;
            for (const tier of allTiers) {
                const counts = tierMap.get(tier.id.toString()) || { total: 0, maintained: 0, grace: 0 };

                // 개별 티어 스냅샷 기록 (유지/유예 인원 포함)
                await this.auditService.recordTierStats(now, tier.id, {
                    snapshotUserCount: counts.total,
                    maintainedCount: counts.maintained,
                    graceCount: counts.grace
                });
                processedCount++;
            }

            this.logger.log(`Hourly tier stats aggregation job dispatched. (Total Tiers: ${allTiers.length}, Processed: ${processedCount})`);
        } catch (error) {
            this.logger.error('Failed to aggregate tier stats:', error);
            throw error; // BullMQ가 재시도할 수 있도록 에러 전파
        }
    }
}

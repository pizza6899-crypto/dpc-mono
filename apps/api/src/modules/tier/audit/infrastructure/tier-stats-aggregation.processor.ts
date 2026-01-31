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

            // 각 티어별 현재 사용자 수 집계 (GROUP BY)
            const counts = await this.userTierRepository.countGroupByTierId();
            const countMap = new Map<string, number>();
            counts.forEach(c => countMap.set(c.tierId.toString(), c.count));

            let processedCount = 0;
            for (const tier of allTiers) {
                // 해당 티어에 유저가 없는 경우 0으로 처리
                const userCount = countMap.get(tier.id.toString()) ?? 0;

                // 개별 티어 스냅샷 기록을 위한 비동기 잡 생성
                await this.auditService.recordTierStats(now, tier.id, {
                    snapshotUserCount: userCount
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

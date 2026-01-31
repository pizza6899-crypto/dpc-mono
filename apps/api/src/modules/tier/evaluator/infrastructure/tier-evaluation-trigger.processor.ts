import { Processor } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import { BULLMQ_QUEUES, getQueueConfig } from 'src/infrastructure/bullmq/bullmq.constants';
import { UserTierRepositoryPort } from '../../profile/infrastructure/user-tier.repository.port';
import { nowUtc } from 'src/utils/date.util';
import { TierEvaluationJobType, TierEvaluationJobPayload } from './tier-evaluation.types';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.TIER_EVALUATOR.EVALUATION_TRIGGER);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class TierEvaluationTriggerProcessor extends BaseProcessor<any, void> {
    protected readonly logger = new Logger(TierEvaluationTriggerProcessor.name);

    constructor(
        private readonly userTierRepository: UserTierRepositoryPort,
        @InjectQueue(BULLMQ_QUEUES.TIER_EVALUATOR.USER_EVALUATION.name)
        private readonly userEvaluationQueue: Queue,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<any>): Promise<void> {
        this.logger.log('Starting tier evaluation trigger...');

        try {
            const now = nowUtc();
            // 심사가 필요한 유저들을 대량으로 조회 (한 번에 1000명 단위로 처리 가능하도록 페이징 처리 가능)
            // 여기서는 단순화하여 일정 수량 가져오기
            const targets = await this.userTierRepository.findUsersNeedingEvaluation(now, 500);

            if (targets.length === 0) {
                this.logger.log('No users need evaluation at this time.');
                return;
            }

            // 개별 유저 심사 잡 생성
            const evalJobs = targets.map(target => ({
                name: `evaluate-user-${target.userId}`,
                data: {
                    type: TierEvaluationJobType.EVALUATE_USER,
                    data: { userId: target.userId.toString() }
                } as TierEvaluationJobPayload,
            }));

            await this.userEvaluationQueue.addBulk(evalJobs);

            this.logger.log(`Tier evaluation triggered for ${targets.length} users.`);
        } catch (error) {
            this.logger.error('Failed to trigger tier evaluation:', error);
            throw error;
        }
    }
}

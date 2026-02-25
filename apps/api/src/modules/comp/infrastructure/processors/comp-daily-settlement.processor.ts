import { Processor } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { BaseProcessor } from 'src/infrastructure/bullmq/base.processor';
import {
    BULLMQ_QUEUES,
    getQueueConfig,
} from 'src/infrastructure/bullmq/bullmq.constants';
import { SettleDailyCompService } from '../../application/settle-daily-comp.service';

const queueConfig = getQueueConfig(BULLMQ_QUEUES.COMP.DAILY_SETTLEMENT);

@Processor(queueConfig.processorOptions, queueConfig.workerOptions)
export class CompDailySettlementProcessor extends BaseProcessor<any, void> {
    protected readonly logger = new Logger(CompDailySettlementProcessor.name);

    constructor(
        private readonly settleDailyCompService: SettleDailyCompService,
        protected readonly cls: ClsService,
    ) {
        super();
    }

    protected async processJob(job: Job<any>): Promise<void> {
        this.logger.log('Starting daily comp settlement worker job...');

        try {
            await this.settleDailyCompService.execute();
            this.logger.log('Daily comp settlement worker job completed successfully.');
        } catch (error) {
            this.logger.error('Failed to process daily comp settlement:', error);
            throw error;
        }
    }
}
